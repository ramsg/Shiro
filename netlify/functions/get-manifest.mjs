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
    // Try to fetch from static /audio/manifest.json (served by Netlify)
    const res = await fetch('https://' + req.headers.host + '/audio/manifest.json');

    if (res.ok) {
      const manifest = await res.json();
      return { statusCode: 200, body: JSON.stringify(manifest), headers };
    }
  } catch (error) {
    console.log('Manifest not found:', error.message);
  }

  // Return empty manifest if not found
  return { statusCode: 200, body: JSON.stringify({ daily: {}, weekly: {} }), headers };
};
