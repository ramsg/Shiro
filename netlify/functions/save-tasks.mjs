const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

async function commitToGitHub(filePath, fileContent, message) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const branch = 'main';

  // Get current file SHA if it exists
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
    console.log('File does not exist yet');
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

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (token !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }), headers };
    }

    const tasks = JSON.parse(req.body || '{}');

    // Commit tasks.json to GitHub
    await commitToGitHub(
      'audio/tasks.json',
      JSON.stringify(tasks, null, 2),
      'Update task definitions'
    );

    return { statusCode: 200, body: JSON.stringify({ success: true }), headers };
  } catch (error) {
    console.error('Error saving tasks:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }), headers };
  }
};
