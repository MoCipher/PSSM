import { createToken } from '../../../utils/auth.js';

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
    const { password } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check password against environment variable
    const MASTER_PASSWORD = env.MASTER_PASSWORD;
    if (!MASTER_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (password !== MASTER_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Authentication successful - create token
    const userId = 'user-master';
    const userEmail = 'admin@mocipher.com';

    // Ensure user exists in database (no REPLACE to avoid cascade delete)
    try {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO users (id, email, created_at, last_login) VALUES (?, ?, datetime(\'now\'), datetime(\'now\'))'
      ).bind(userId, userEmail).run();
      await env.DB.prepare(
        'UPDATE users SET email = ?, last_login = datetime(\'now\') WHERE id = ?'
      ).bind(userEmail, userId).run();
    } catch (dbError) {
      console.error('Failed to update user in database:', dbError);
      // Continue anyway - user might already exist
    }

    const token = createToken(userId, userEmail, env.JWT_SECRET);

    return new Response(JSON.stringify({
      token,
      user: {
        id: userId,
        email: userEmail,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}