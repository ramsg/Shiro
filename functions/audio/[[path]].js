// Catch-all: serves /audio/* files from GitHub repo
// e.g. /audio/daily/monday.mp3 → fetches from GitHub raw content

export async function onRequest(context) {
  const { request, env, params } = context;

  // Reconstruct the file path from the URL segments
  const pathSegments = params.path; // e.g. ["daily", "monday.mp3"]
  const filePath = `audio/${pathSegments.join('/')}`;

  const [owner, repo] = (env.GITHUB_REPO || '').split('/');
  const token = env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return new Response('Server configuration error', { status: 500 });
  }

  try {
    // Fetch file metadata from GitHub API
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'farm-dashboard'
        }
      }
    );

    if (!res.ok) {
      console.log(`Audio file not found: ${filePath}`, res.status);
      return new Response('Audio not found', { status: 404 });
    }

    const data = await res.json();

    // GitHub returns base64-encoded content for files < 1MB
    // For larger files, use the download_url
    if (data.download_url) {
      // Fetch the raw file directly
      const audioRes = await fetch(data.download_url, {
        headers: { 'User-Agent': 'farm-dashboard' }
      });

      if (!audioRes.ok) {
        return new Response('Failed to fetch audio', { status: 502 });
      }

      const audioData = await audioRes.arrayBuffer();

      return new Response(audioData, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Fallback: decode base64 content from API response
    if (data.content) {
      const binaryStr = atob(data.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      return new Response(bytes.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response('Audio not found', { status: 404 });
  } catch (e) {
    console.error('Error serving audio:', e);
    return new Response('Internal error', { status: 500 });
  }
}
