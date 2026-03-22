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

async function commitToGitHub(filePath, fileContent, message) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const branch = 'main';

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

  const encodedContent = Buffer.from(fileContent).toString('base64');

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
        message,
        content: encodedContent,
        branch,
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
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (token !== process.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 403);
    }

    const body = await req.text();
    const tasks = JSON.parse(body || '{}');

    await commitToGitHub(
      'audio/tasks.json',
      JSON.stringify(tasks, null, 2),
      'Update task definitions'
    );

    return json({ success: true });
  } catch (error) {
    console.error('Error saving tasks:', error);
    return json({ error: error.message }, 500);
  }
};
