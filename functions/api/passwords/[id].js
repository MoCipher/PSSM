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
  const userEmail = userData.email || `${userId}@local`;
  const passwordId = params.id;

  const ensureUser = async () => {
    try {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO users (id, email, created_at, last_login) VALUES (?, ?, datetime(\'now\'), datetime(\'now\'))'
      ).bind(userId, userEmail).run();
      await env.DB.prepare(
        'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?'
      ).bind(userId).run();
    } catch (error) {
      console.error('Failed to ensure user:', error);
    }
  };

  const ensureEventsTable = async () => {
    try {
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS sync_events (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT, password_id TEXT, count INTEGER, created_at TEXT)'
      ).run();
    } catch (error) {
      console.error('Failed to ensure sync_events table:', error);
    }
  };

  const mapPasswordRow = (row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    username: row.username,
    password: row.password,
    url: row.url,
    notes: row.notes,
    twoFactorSecret: row.two_factor_secret,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsed: row.last_used ?? null
  });

  try {
    await ensureUser();
    await ensureEventsTable();
    if (request.method === 'PUT') {
      // Update or insert password (UPSERT)
      const updateData = await request.json();

      // Use INSERT OR REPLACE to handle both new and existing passwords
      const createdAt = typeof updateData.createdAt === 'number'
        ? new Date(updateData.createdAt).toISOString()
        : (updateData.createdAt || new Date().toISOString());
      const updatedAt = typeof updateData.updatedAt === 'number'
        ? new Date(updateData.updatedAt).toISOString()
        : new Date().toISOString();
      const statement = env.DB.prepare(
        'INSERT OR REPLACE INTO passwords (id, user_id, name, username, password, url, notes, two_factor_secret, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        passwordId,
        userId,
        updateData.name || '',
        updateData.username || '',
        updateData.password || '',
        updateData.url || '',
        updateData.notes || '',
        updateData.twoFactorSecret || '',
        createdAt,
        updatedAt
      );
      await env.DB.batch([statement]);

      const updated = await env.DB.prepare(
        'SELECT * FROM passwords WHERE id = ? AND user_id = ?'
      ).bind(passwordId, userId).first();

      if (!updated) {
        return new Response(JSON.stringify({ error: 'Failed to save password' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await env.DB.prepare(
        'INSERT INTO sync_events (user_id, action, password_id, count, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
      ).bind(userId, 'upsert', passwordId, 1).run();

      return new Response(JSON.stringify({
        success: true,
        password: mapPasswordRow(updated)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (request.method === 'DELETE') {
      // Delete password
      const existing = await env.DB.prepare(
        'SELECT id FROM passwords WHERE id = ? AND user_id = ?'
      ).bind(passwordId, userId).first();

      if (existing) {
        await env.DB.prepare(
          'DELETE FROM passwords WHERE id = ? AND user_id = ?'
        ).bind(passwordId, userId).run();
      }

      await env.DB.prepare(
        'INSERT INTO sync_events (user_id, action, password_id, count, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
      ).bind(userId, 'delete', passwordId, existing ? 1 : 0).run();

      return new Response(JSON.stringify({
        success: true,
        deletedId: passwordId,
        notFound: !existing
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