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
  const userEmail = userData.email || `${userId}@local`;

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
    if (request.method === 'GET') {
      // Get all passwords for user
      const passwords = await env.DB.prepare(
        'SELECT * FROM passwords WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(userId).all();

      const normalized = (passwords.results || []).map(mapPasswordRow);

      return new Response(JSON.stringify({ passwords: normalized }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (request.method === 'POST') {
      // Sync passwords
      const { passwords, syncType } = await request.json();

      if (!Array.isArray(passwords)) {
        return new Response(JSON.stringify({ error: 'Passwords array required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (syncType !== 'import') {
        return new Response(JSON.stringify({
          error: 'Bulk sync not allowed without import flag'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (passwords.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          syncedAt: new Date().toISOString(),
          count: 0,
          skipped: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build insert statements first; do not delete unless payload is valid
      const statements = [];
      const invalidEntries = [];
      for (const password of passwords) {
        if (!password || !password.id) {
          invalidEntries.push(password);
          continue;
        }

        const createdAt = typeof password.createdAt === 'number'
          ? new Date(password.createdAt).toISOString()
          : (password.createdAt || new Date().toISOString());
        const updatedAt = typeof password.updatedAt === 'number'
          ? new Date(password.updatedAt).toISOString()
          : (password.updatedAt || new Date().toISOString());

        statements.push(
          env.DB.prepare(
            'INSERT OR REPLACE INTO passwords (id, user_id, name, username, password, url, notes, two_factor_secret, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            password.id,
            userId,
            password.name || '',
            password.username || '',
            password.password || '',
            password.url || '',
            password.notes || '',
            password.twoFactorSecret || '',
            createdAt,
            updatedAt
          )
        );
      }

      if (invalidEntries.length > 0 || statements.length === 0) {
        return new Response(JSON.stringify({
          error: 'Invalid password payload',
          invalidCount: invalidEntries.length,
          count: statements.length
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const deleteStatement = env.DB.prepare('DELETE FROM passwords WHERE user_id = ?').bind(userId);
      await env.DB.batch([deleteStatement, ...statements]);

      const insertedCount = statements.length;

      await env.DB.prepare(
        'INSERT INTO sync_events (user_id, action, password_id, count, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
      ).bind(userId, 'bulk-sync', null, insertedCount).run();

      return new Response(JSON.stringify({
        success: true,
        syncedAt: new Date().toISOString(),
        count: insertedCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Password sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}