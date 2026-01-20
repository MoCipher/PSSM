export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Auth routes
      if (url.pathname.startsWith('/api/auth/')) {
        return handleAuth(request, env, corsHeaders);
      }

      // Password routes (protected)
      if (url.pathname.startsWith('/api/passwords/')) {
        return handlePasswords(request, env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Authentication handlers
async function handleAuth(request, env, corsHeaders) {
  const url = new URL(request.url);

  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    return handleRegister(request, env, corsHeaders);
  }

  if (url.pathname === '/api/auth/register/verify' && request.method === 'POST') {
    return handleRegisterVerify(request, env, corsHeaders);
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    return handleLogin(request, env, corsHeaders);
  }

  if (url.pathname === '/api/auth/login/verify' && request.method === 'POST') {
    return handleLoginVerify(request, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Password handlers (require authentication)
async function handlePasswords(request, env, corsHeaders) {
  // Verify token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authorization required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);
  const userData = verifySimpleToken(token, env.JWT_SECRET);

  if (!userData) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const userId = userData.userId;

  const url = new URL(request.url);

  if (url.pathname === '/api/passwords' && request.method === 'GET') {
    return handleGetPasswords(userId, env, corsHeaders);
  }

  if (url.pathname === '/api/passwords/sync' && request.method === 'POST') {
    return handleSyncPasswords(request, userId, env, corsHeaders);
  }

  if (url.pathname.startsWith('/api/passwords/') && request.method === 'PUT') {
    const id = url.pathname.split('/api/passwords/')[1];
    return handleUpdatePassword(request, userId, id, env, corsHeaders);
  }

  if (url.pathname.startsWith('/api/passwords/') && request.method === 'DELETE') {
    const id = url.pathname.split('/api/passwords/')[1];
    return handleDeletePassword(userId, id, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Registration handler
async function handleRegister(request, env, corsHeaders) {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if user exists
  const existingUser = await env.USERS.get(`user:${email.toLowerCase()}`);
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'Account already exists' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code temporarily (5 minutes)
  await env.VERIFICATION_CODES.put(
    `register:${email.toLowerCase()}`,
    JSON.stringify({ code, timestamp: Date.now() }),
    { expirationTtl: 300 }
  );

  // Send email
  await sendVerificationEmail(email, code, env);

  return new Response(JSON.stringify({
    message: 'Verification code sent',
    email: email.toLowerCase()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Registration verification handler
async function handleRegisterVerify(request, env, corsHeaders) {
  const { email, code } = await request.json();

  const stored = await env.VERIFICATION_CODES.get(`register:${email.toLowerCase()}`);
  if (!stored) {
    return new Response(JSON.stringify({ error: 'Code expired or invalid' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { code: storedCode } = JSON.parse(stored);
  if (storedCode !== code) {
    return new Response(JSON.stringify({ error: 'Invalid code' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Create user
  const userId = crypto.randomUUID();
  const user = {
    id: userId,
    email: email.toLowerCase(),
    createdAt: new Date().toISOString()
  };

  await env.USERS.put(`user:${email.toLowerCase()}`, JSON.stringify(user));
  await env.USERS.put(`user_id:${userId}`, JSON.stringify(user));

  // Generate token
  const token = generateSimpleToken(user.id, user.email, env.JWT_SECRET);

  // Clean up verification code
  await env.VERIFICATION_CODES.delete(`register:${email.toLowerCase()}`);

  return new Response(JSON.stringify({
    message: 'Account created',
    token,
    user
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Login handler
async function handleLogin(request, env, corsHeaders) {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if user exists
  const user = await env.USERS.get(`user:${email.toLowerCase()}`);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Account not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code temporarily (5 minutes)
  await env.VERIFICATION_CODES.put(
    `login:${email.toLowerCase()}`,
    JSON.stringify({ code, timestamp: Date.now() }),
    { expirationTtl: 300 }
  );

  // Send email
  await sendVerificationEmail(email, code, env);

  return new Response(JSON.stringify({
    message: 'Verification code sent',
    email: email.toLowerCase()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Login verification handler
async function handleLoginVerify(request, env, corsHeaders) {
  const { email, code } = await request.json();

  const stored = await env.VERIFICATION_CODES.get(`login:${email.toLowerCase()}`);
  if (!stored) {
    return new Response(JSON.stringify({ error: 'Code expired or invalid' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { code: storedCode } = JSON.parse(stored);
  if (storedCode !== code) {
    return new Response(JSON.stringify({ error: 'Invalid code' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get user
  const userData = await env.USERS.get(`user:${email.toLowerCase()}`);
  const user = JSON.parse(userData);

  // Update last login
  user.lastLogin = new Date().toISOString();
  await env.USERS.put(`user:${email.toLowerCase()}`, JSON.stringify(user));

  // Generate token
  const token = generateSimpleToken(user.id, user.email, env.JWT_SECRET);

  // Clean up verification code
  await env.VERIFICATION_CODES.delete(`login:${email.toLowerCase()}`);

  return new Response(JSON.stringify({
    message: 'Login successful',
    token,
    user
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Password handlers
async function handleGetPasswords(userId, env, corsHeaders) {
  const passwords = await env.PASSWORDS.get(`user_passwords:${userId}`) || '[]';
  return new Response(passwords, {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleSyncPasswords(request, userId, env, corsHeaders) {
  const { passwords } = await request.json();
  await env.PASSWORDS.put(`user_passwords:${userId}`, JSON.stringify(passwords));

  return new Response(JSON.stringify({
    success: true,
    syncedAt: new Date().toISOString(),
    count: passwords.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleUpdatePassword(request, userId, passwordId, env, corsHeaders) {
  const updateData = await request.json();
  const passwordsData = await env.PASSWORDS.get(`user_passwords:${userId}`);
  const passwords = JSON.parse(passwordsData || '[]');

  const index = passwords.findIndex(p => p.id === passwordId);
  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Password not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  passwords[index] = { ...passwords[index], ...updateData, updatedAt: new Date().toISOString() };
  await env.PASSWORDS.put(`user_passwords:${userId}`, JSON.stringify(passwords));

  return new Response(JSON.stringify({
    success: true,
    password: passwords[index]
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleDeletePassword(userId, passwordId, env, corsHeaders) {
  const passwordsData = await env.PASSWORDS.get(`user_passwords:${userId}`);
  const passwords = JSON.parse(passwordsData || '[]');

  const filteredPasswords = passwords.filter(p => p.id !== passwordId);
  if (filteredPasswords.length === passwords.length) {
    return new Response(JSON.stringify({ error: 'Password not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.PASSWORDS.put(`user_passwords:${userId}`, JSON.stringify(filteredPasswords));

  return new Response(JSON.stringify({
    success: true,
    deletedId: passwordId
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Utility functions
function generateSimpleToken(userId, email, secret) {
  // Simple token generation for demo - in production, use proper JWT
  const payload = `${userId}:${email}:${Date.now()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);

  // Simple hash for demo (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
  }

  return btoa(payload).replace(/=/g, '') + '.' + Math.abs(hash).toString(36);
}

function verifySimpleToken(token, secret) {
  try {
    const [payloadB64] = token.split('.');
    const payload = atob(payloadB64);
    const [userId, email, timestamp] = payload.split(':');

    // Check if token is not too old (24 hours)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 24 * 60 * 60 * 1000) {
      return null;
    }

    return { userId, email };
  } catch (error) {
    return null;
  }
}

async function sendVerificationEmail(email, code, env) {
  // Use any email service you prefer - this is just a template
  // Replace with your email service integration

  console.log(`Sending verification code ${code} to ${email}`);

  // Example integrations (uncomment and configure one):

  // 1. SendGrid
  /*
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: env.EMAIL_FROM },
      subject: 'Your Password Manager Verification Code',
      content: [{
        type: 'text/html',
        value: `<h2>Your verification code is: <strong>${code}</strong></h2><p>This code expires in 5 minutes.</p>`
      }]
    })
  });
  */

  // 2. Mailgun
  /*
  const response = await fetch(`https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${env.EMAIL_API_KEY}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Your Password Manager Verification Code',
      html: `<h2>Your verification code is: <strong>${code}</strong></h2><p>This code expires in 5 minutes.</p>`
    })
  });
  */

  // 3. Any SMTP service
  // Configure your SMTP settings in wrangler.toml and use a library

  // For now, we'll just log the email (replace with actual sending)
  const emailData = {
    to: email,
    from: env.EMAIL_FROM || 'noreply@yourapp.com',
    subject: 'Your Password Manager Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Manager Verification</h2>
        <p>Hello!</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px;">${code}</span>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Your Password Manager</p>
      </div>
    `
  };

  console.log('Email to send:', emailData);

  // TODO: Replace console.log with actual email sending using your preferred service
  // The code above shows examples for SendGrid and Mailgun
}