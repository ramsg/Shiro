const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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

    const uploadUrl = `https://${process.env.BUNNY_FTP_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE}/tasks.json`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': process.env.BUNNY_CDN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tasks)
    });

    if (!response.ok) {
      throw new Error(`Bunny upload failed with status ${response.status}`);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }), headers };
  } catch (error) {
    console.error('Error saving tasks:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }), headers };
  }
};
