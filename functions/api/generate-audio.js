const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

// String → base64 (for JSON content)
function strToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// base64 → string (for reading GitHub file content)
function base64ToStr(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

async function githubGet(owner, repo, path, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'farm-dashboard' } }
  );
  return res.ok ? res.json() : null;
}

async function githubPut(owner, repo, path, token, content, message, sha) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'farm-dashboard'
      },
      body: JSON.stringify({ message, content, branch: 'main', ...(sha && { sha }) })
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(`GitHub write failed: ${e.message}`); }
  return res.json();
}

// Google Cloud TTS - synthesize Kannada speech
async function synthesize(text, apiKey) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'kn-IN',
          name: 'kn-IN-Standard-A',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.95,
          pitch: 0
        }
      })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Google TTS error:', res.status, err);
    throw new Error(`Google TTS failed (${res.status}): ${err.error?.message || JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.audioContent; // base64-encoded MP3
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (token !== env.ADMIN_PASSWORD) return json({ error: 'Unauthorized' }, 403);

    const { type, day, script } = await request.json();
    if (!type || !day || !script) return json({ error: 'Missing required fields' }, 400);

    if (!env.GOOGLE_TTS_KEY) {
      return json({ error: 'Google TTS API key not configured' }, 500);
    }

    const [owner, repo] = env.GITHUB_REPO.split('/');

    // 1. Synthesize Kannada speech via Google Cloud TTS
    console.log(`Generating audio for ${type}/${day}...`);
    const base64Audio = await synthesize(script, env.GOOGLE_TTS_KEY);
    console.log(`Audio generated: ${base64Audio.length} base64 chars`);

    const audioPath = `audio/${type}/${day}.mp3`;

    // 2. Commit MP3 to GitHub
    const existing = await githubGet(owner, repo, audioPath, env.GITHUB_TOKEN);
    await githubPut(owner, repo, audioPath, env.GITHUB_TOKEN,
      base64Audio, `Generate audio for ${type} ${day}`, existing?.sha);

    // 3. Read + update manifest
    let manifest = { daily: {}, weekly: {} };
    const mFile = await githubGet(owner, repo, 'audio/manifest.json', env.GITHUB_TOKEN);
    if (mFile?.content) {
      try { manifest = JSON.parse(base64ToStr(mFile.content)); } catch (_) {}
    }
    if (!manifest[type]) manifest[type] = {};
    manifest[type][day] = {
      generatedAt: new Date().toISOString(),
      url: `/audio/${type}/${day}.mp3`,
      size: Math.round(base64Audio.length * 0.75) // approximate decoded size
    };
    await githubPut(owner, repo, 'audio/manifest.json', env.GITHUB_TOKEN,
      strToBase64(JSON.stringify(manifest, null, 2)),
      `Update manifest for ${type}/${day}`, mFile?.sha);

    // 4. Return audio as base64 for immediate preview
    return json({
      success: true,
      url: `/audio/${type}/${day}.mp3`,
      audioBase64: base64Audio,
      size: Math.round(base64Audio.length * 0.75)
    });
  } catch (e) {
    console.error('Error in generate-audio:', e);
    return json({ error: e.message }, 500);
  }
}
