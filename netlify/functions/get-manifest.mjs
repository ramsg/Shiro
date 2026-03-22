const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/audio/manifest.json`,
      { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );

    if (res.ok) {
      const data = await res.json();
      const manifest = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      return json(manifest);
    }
  } catch (error) {
    console.log('Manifest not found, returning empty:', error.message);
  }

  // No manifest yet — return empty (first run)
  return json({ daily: {}, weekly: {} });
};
