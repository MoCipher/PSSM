import { generateVerificationCode, sendVerificationEmail } from '../../../utils/auth.js';

// Authorized users
const AUTHORIZED_USERS = [
  'spoass@icloud.com',
  'laila.torresanz@hotmail.com'
];

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
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if email is authorized
    if (!AUTHORIZED_USERS.includes(normalizedEmail)) {
      return new Response(JSON.stringify({ error: 'Access denied. Unauthorized email.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Initialize user if they don't exist
    let user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();

    if (!user) {
      // Create user
      const userId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)'
      ).bind(userId, normalizedEmail, new Date().toISOString()).run();

      user = { id: userId, email: normalizedEmail };
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code
    await env.DB.prepare(
      'INSERT OR REPLACE INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(
      normalizedEmail,
      code,
      'login',
      Date.now() + (5 * 60 * 1000)
    ).run();

    // Send email
    await sendVerificationEmail(email, code, env);

    return new Response(JSON.stringify({
      message: 'Verification code sent',
      email: normalizedEmail
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}