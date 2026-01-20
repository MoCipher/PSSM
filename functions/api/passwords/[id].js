import { verifyToken } from '../../../utils/auth.js';

export async function onRequest({ request, env, params }) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
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
  const passwordId = params.id;

  try {
    if (request.method === 'PUT') {
      // Update password
      const updateData = await request.json();

      const existing = await env.DB.prepare(
        'SELECT id FROM passwords WHERE id = ? AND user_id = ?'
      ).bind(passwordId, userId).first();

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Password not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await env.DB.prepare(
        'UPDATE passwords SET name = ?, username = ?, password = ?, url = ?, notes = ?, two_factor_secret = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(
        updateData.name || '',
        updateData.username || '',
        updateData.password || '',
        updateData.url || '',
        updateData.notes || '',
        updateData.twoFactorSecret || '',
        new Date().toISOString(),
        passwordId,
        userId
      ).run();

      const updated = await env.DB.prepare(
        'SELECT * FROM passwords WHERE id = ? AND user_id = ?'
      ).bind(passwordId, userId).first();

      return new Response(JSON.stringify({
        success: true,
        password: updated
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (request.method === 'DELETE') {
      // Delete password
      const existing = await env.DB.prepare(
        'SELECT id FROM passwords WHERE id = ? AND user_id = ?'
      ).bind(passwordId, userId).first();

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Password not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await env.DB.prepare(
        'DELETE FROM passwords WHERE id = ? AND user_id = ?'
      ).bind(passwordId, userId).run();

      return new Response(JSON.stringify({
        success: true,
        deletedId: passwordId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Password operation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}