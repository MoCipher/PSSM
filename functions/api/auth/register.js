import { generateVerificationCode, sendVerificationEmail, createToken } from '../../../utils/auth.js';

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
    if (!env.DB) {
      console.error('D1 binding not found. env.DB is undefined');
      return new Response(JSON.stringify({ error: 'Database connection failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    let user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();

    if (user) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Create new user
    const userId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)'
    ).bind(userId, normalizedEmail, new Date().toISOString()).run();

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code
    await env.DB.prepare(
      'INSERT OR REPLACE INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(
      normalizedEmail,
      code,
      'register',
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
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}