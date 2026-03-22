const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const url = `https://${process.env.BUNNY_STORAGE_ZONE}.b-cdn.net/manifest.json`;
    const res = await fetch(url);

    if (!res.ok) {
      return { statusCode: 200, body: JSON.stringify({ daily: {}, weekly: {} }), headers };
    }

    const manifest = await res.json();
    return { statusCode: 200, body: JSON.stringify(manifest), headers };
  } catch (error) {
    console.error('Error fetching manifest:', error);
    return { statusCode: 200, body: JSON.stringify({ daily: {}, weekly: {} }), headers };
  }
};
