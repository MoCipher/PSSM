import { generateVerificationCode, sendVerificationEmail, createToken } from '../../../utils/auth.js';

// Registration is disabled - only specific users allowed
export async function onRequest() {
  return new Response(JSON.stringify({
    error: 'Registration is not available. Contact administrator.'
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}