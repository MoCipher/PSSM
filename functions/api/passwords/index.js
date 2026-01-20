import { verifyToken } from '../../../utils/auth.js';

export async function onRequest({ request, env }) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authorization required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.substring(7);
  const userData = verifyToken(token, env.JWT_SECRET);

  if (!userData) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = userData.userId;

  try {
    if (request.method === 'GET') {
      // Get all passwords for user
      const passwords = await env.DB.prepare(
        'SELECT * FROM passwords WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(userId).all();

      return new Response(JSON.stringify({ passwords: passwords.results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (request.method === 'POST') {
      // Sync passwords
      const { passwords } = await request.json();

      if (!Array.isArray(passwords)) {
        return new Response(JSON.stringify({ error: 'Passwords array required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Clear existing passwords and insert new ones
      await env.DB.prepare('DELETE FROM passwords WHERE user_id = ?').bind(userId).run();

      for (const password of passwords) {
        await env.DB.prepare(
          'INSERT INTO passwords (id, user_id, name, username, password, url, notes, two_factor_secret, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          password.id,
          userId,
          password.name || '',
          password.username || '',
          password.password || '',
          password.url || '',
          password.notes || '',
          password.twoFactorSecret || '',
          password.createdAt || new Date().toISOString(),
          password.updatedAt || new Date().toISOString()
        ).run();
      }

      return new Response(JSON.stringify({
        success: true,
        syncedAt: new Date().toISOString(),
        count: passwords.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Passwords error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}