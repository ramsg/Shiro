const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

// Cloudflare-compatible base64 encode (no Buffer)
function strToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function githubGet(owner, repo, path, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, content, branch: 'main', ...(sha && { sha }) })
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (token !== env.ADMIN_PASSWORD) return json({ error: 'Unauthorized' }, 403);

    const tasks = await request.json();
    const [owner, repo] = env.GITHUB_REPO.split('/');
    const existing = await githubGet(owner, repo, 'audio/tasks.json', env.GITHUB_TOKEN);

    await githubPut(owner, repo, 'audio/tasks.json', env.GITHUB_TOKEN,
      strToBase64(JSON.stringify(tasks, null, 2)),
      'Update task definitions', existing?.sha);

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
