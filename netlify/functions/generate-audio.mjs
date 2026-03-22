const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

async function githubGet(owner, repo, path, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
  );
  if (!res.ok) return null;
  return res.json();
}

async function githubPut(owner, repo, path, token, content, message, sha) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, content, branch: 'main', ...(sha && { sha }) })
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`GitHub write failed: ${err.message}`);
  }
  return res.json();
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (token !== process.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 403);
    }

    const body = await req.text();
    const { type, day, script } = JSON.parse(body || '{}');
    if (!type || !day || !script) {
      return json({ error: 'Missing required fields: type, day, script' }, 400);
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_REGION;
    if (!speechKey || !speechRegion) {
      return json({ error: 'Azure Speech credentials not configured' }, 500);
    }

    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const ghToken = process.env.GITHUB_TOKEN;

    // 1. Get Azure access token
    const tokenRes = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': speechKey } }
    );
    if (!tokenRes.ok) return json({ error: 'Failed to get Azure token' }, 500);
    const accessToken = await tokenRes.text();

    // 2. Synthesize Kannada speech
    const ssml = `<speak version='1.0' xml:lang='kn-IN'>
      <voice xml:lang='kn-IN' xml:gender='Female' name='kn-IN-SapnaNeural'>
        ${script.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
      </voice>
    </speak>`;

    const ttsRes = await fetch(
      `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      }
    );
    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return json({ error: `Azure TTS failed: ${errText}` }, 500);
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const base64Audio = Buffer.from(audioBytes).toString('base64');
    const audioPath = `audio/${type}/${day}.mp3`;

    // 3. Commit MP3 to GitHub (create or update)
    const existing = await githubGet(owner, repo, audioPath, ghToken);
    await githubPut(owner, repo, audioPath, ghToken, base64Audio,
      `Generate audio for ${type} ${day}`, existing?.sha);

    // 4. Read current manifest from GitHub (so we don't lose other days)
    let manifest = { daily: {}, weekly: {} };
    const mFile = await githubGet(owner, repo, 'audio/manifest.json', ghToken);
    if (mFile?.content) {
      try { manifest = JSON.parse(Buffer.from(mFile.content, 'base64').toString('utf8')); }
      catch (_) {}
    }

    // 5. Update this day's entry and write manifest back to GitHub
    if (!manifest[type]) manifest[type] = {};
    manifest[type][day] = {
      generatedAt: new Date().toISOString(),
      url: `/audio/${type}/${day}.mp3`,
      size: audioBytes.length
    };
    await githubPut(owner, repo, 'audio/manifest.json', ghToken,
      Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64'),
      `Update manifest for ${type}/${day}`, mFile?.sha);

    // 6. Return audio as base64 for immediate in-session preview
    return json({
      success: true,
      url: `/audio/${type}/${day}.mp3`,
      audioBase64: base64Audio,
      size: audioBytes.length
    });
  } catch (error) {
    console.error('Error in generate-audio:', error);
    return json({ error: error.message }, 500);
  }
};
