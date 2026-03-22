const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Return empty manifest - audio generation coming soon
  return { statusCode: 200, body: JSON.stringify({ daily: {}, weekly: {} }), headers };
};
