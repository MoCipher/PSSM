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
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if user exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Account already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Store verification code (expires in 5 minutes)
    await env.DB.prepare(
      'INSERT OR REPLACE INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(
      email.toLowerCase(),
      code,
      'register',
      Date.now() + (5 * 60 * 1000) // 5 minutes
    ).run();

    // Send email
    await sendVerificationEmail(email, code, env);

    return new Response(JSON.stringify({
      message: 'Verification code sent',
      email: email.toLowerCase()
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