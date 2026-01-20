// Authentication utilities for Cloudflare Pages Functions

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createToken(userId, email, secret) {
  // Simple token generation for demo (not cryptographically secure for production)
  const payload = `${userId}:${email}:${Date.now()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);

  // Simple hash for demo
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
  }

  return btoa(payload).replace(/=/g, '') + '.' + Math.abs(hash).toString(36);
}

export function verifyToken(token, secret) {
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

export async function sendVerificationEmail(email, code, env) {
  // Configure your email service here
  console.log(`Sending verification code ${code} to ${email}`);

  // Example configurations for different email services:

  // SendGrid
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
        value: `
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
      }]
    })
  });
  */

  // Mailgun
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
    })
  });
  */

  // SendGrid integration (recommended for Cloudflare)
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
        value: `
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
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SendGrid error:', errorText);
    throw new Error(`Failed to send email: ${errorText}`);
  }

  console.log(`Verification email sent successfully to ${email}`);
  return true;
}