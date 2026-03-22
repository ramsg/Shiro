const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { password } = JSON.parse(req.body || '{}');

    if (password === process.env.ADMIN_PASSWORD) {
      // Create a simple token (for MVP, just use password again)
      return {
        statusCode: 200,
        body: JSON.stringify({ token: password }),
        headers
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid password' }),
      headers
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request' }),
      headers
    };
  }
};
