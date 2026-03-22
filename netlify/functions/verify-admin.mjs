const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const { password } = JSON.parse(body || '{}');

    if (password === process.env.ADMIN_PASSWORD) {
      return json({ token: password });
    }

    return json({ error: 'Invalid password' }, 401);
  } catch (error) {
    return json({ error: 'Invalid request' }, 400);
  }
};
