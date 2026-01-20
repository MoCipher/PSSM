// Registration verification is disabled
export async function onRequest() {
  return new Response(JSON.stringify({
    error: 'Registration is not available. Contact administrator.'
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}