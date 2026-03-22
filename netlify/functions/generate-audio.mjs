const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function isValidAdminToken(token) {
  return token === process.env.ADMIN_PASSWORD;
}

async function commitToGitHub(filePath, fileContent, message) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const branch = 'main';

  // Get current file SHA if it exists (needed for updates)
  let sha = null;
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
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
  } catch (error) {
    console.log('File does not exist yet, creating new');
  }

  // Encode content to base64
  const encodedContent = Buffer.from(fileContent).toString('base64');

  // Commit to GitHub
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        content: encodedContent,
        branch: branch,
        ...(sha && { sha })
      })
    }
  );

  if (!commitRes.ok) {
    const error = await commitRes.json();
    throw new Error(`GitHub commit failed: ${error.message}`);
  }

  return true;
}

async function getManifest() {
  try {
    const res = await fetch('/.netlify/functions/get-manifest');
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.log('Manifest not found, starting fresh');
  }
  return { daily: {}, weekly: {} };
}

async function saveManifest(manifest) {
  await commitToGitHub(
    'audio/manifest.json',
    JSON.stringify(manifest, null, 2),
    'Update audio manifest with generated files'
  );
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!isValidAdminToken(token)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }), headers };
    }

    const body = JSON.parse(req.body || '{}');
    const { type, day, script } = body;

    if (!type || !day || !script) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: type, day, script' }), headers };
    }

    // Placeholder: Azure Speech SDK integration needed
    // For now, return success to unblock login testing
    const fileName = `${type}/${day}.mp3`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: `/audio/${fileName}`,
        message: 'Audio generation placeholder - Azure integration needed'
      }),
      headers
    };
  } catch (error) {
    console.error('Error in generate-audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers
    };
  }
};
