const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
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

    // Azure TTS via REST API (no SDK needed)
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_REGION;

    if (!speechKey || !speechRegion) {
      return json({ error: 'Azure Speech credentials not configured' }, 500);
    }

    // Get Azure access token
    const tokenRes = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': speechKey }
      }
    );

    if (!tokenRes.ok) {
      return json({ error: 'Failed to get Azure token' }, 500);
    }

    const accessToken = await tokenRes.text();

    // SSML for Kannada TTS
    const ssml = `<speak version='1.0' xml:lang='kn-IN'>
      <voice xml:lang='kn-IN' xml:gender='Female' name='kn-IN-SapnaNeural'>
        ${script.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
      </voice>
    </speak>`;

    // Synthesize speech
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

    // Commit audio to GitHub
    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const fileName = `audio/${type}/${day}.mp3`;
    const base64Audio = Buffer.from(audioBytes).toString('base64');

    // Get existing SHA if file exists
    let sha = null;
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`,
        {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch (_) {}

    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Generate audio for ${type} ${day}`,
          content: base64Audio,
          branch: 'main',
          ...(sha && { sha })
        })
      }
    );

    if (!commitRes.ok) {
      const err = await commitRes.json();
      return json({ error: `GitHub commit failed: ${err.message}` }, 500);
    }

    return json({
      success: true,
      url: `/audio/${type}/${day}.mp3`,
      size: audioBytes.length
    });
  } catch (error) {
    console.error('Error in generate-audio:', error);
    return json({ error: error.message }, 500);
  }
};
