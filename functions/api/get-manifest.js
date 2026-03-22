const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    const [owner, repo] = env.GITHUB_REPO.split('/');
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/audio/manifest.json`,
      { headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );

    if (res.ok) {
      const data = await res.json();
      // Cloudflare: decode base64 using atob
      const manifest = JSON.parse(atob(data.content.replace(/\n/g, '')));
      return json(manifest);
    }
  } catch (e) {
    console.log('Manifest not found:', e.message);
  }

  return json({ daily: {}, weekly: {} });
}
