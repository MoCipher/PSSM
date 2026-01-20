import { createToken } from '../../../../utils/auth.js';

export async function onRequest({ request, env }) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Verify code
    const verification = await env.DB.prepare(
      'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND expires_at > ?'
    ).bind(email.toLowerCase(), code, 'login', Date.now()).first();

    if (!verification) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    // Update last login
    await env.DB.prepare(
      'UPDATE users SET last_login = ? WHERE id = ?'
    ).bind(new Date().toISOString(), user.id).run();

    // Clean up verification code
    await env.DB.prepare(
      'DELETE FROM verification_codes WHERE email = ? AND type = ?'
    ).bind(email.toLowerCase(), 'login').run();

    // Generate token
    const token = createToken(user.id, user.email, env.JWT_SECRET);

    return new Response(JSON.stringify({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, lastLogin: user.last_login }
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Login verification error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}