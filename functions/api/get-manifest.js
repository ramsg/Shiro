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
      { headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'farm-dashboard' } }
    );

    if (res.ok) {
      const data = await res.json();
      const manifest = JSON.parse(atob(data.content.replace(/\n/g, '')));
      console.log('Manifest loaded from GitHub:', Object.keys(manifest.daily || {}));
      return json(manifest);
    } else {
      console.log('GitHub manifest fetch failed:', res.status, await res.text());
    }
  } catch (e) {
    console.log('Manifest error:', e.message);
  }

  return json({ daily: {}, weekly: {} });
}
