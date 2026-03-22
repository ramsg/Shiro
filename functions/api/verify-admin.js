const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    const { password } = await request.json();
    if (password === env.ADMIN_PASSWORD) {
      return json({ token: password });
    }
    return json({ error: 'Invalid password' }, 401);
  } catch (e) {
    return json({ error: 'Invalid request' }, 400);
  }
}
