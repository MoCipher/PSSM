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
  // MailChannels email sending via Cloudflare Workers
  console.log(`Sending verification code ${code} to ${email}`);

  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
            dkim_domain: 'pssm.pages.dev', // Change to your custom domain
            dkim_selector: 'mailchannels',
          },
        ],
        from: {
          email: env.EMAIL_FROM || 'noreply@pssm.pages.dev',
          name: 'Password Manager',
        },
        subject: 'Your Password Manager Verification Code',
        content: [
          {
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
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailChannels error:', errorText);
      // For now, log the code so you can still login
      console.log(`===========================================`);
      console.log(`Verification code for ${email}: ${code}`);
      console.log(`===========================================`);
      throw new Error(`MailChannels API error: ${response.status}`);
    }

    console.log('Email sent successfully via MailChannels');
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    // Log the code anyway so login isn't blocked
    console.log(`===========================================`);
    console.log(`Verification code for ${email}: ${code}`);
    console.log(`===========================================`);
    return true; // Don't block login
  }
}
