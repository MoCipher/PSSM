export async function onRequest() {
  return new Response(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Cloudflare Pages Functions + D1'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}