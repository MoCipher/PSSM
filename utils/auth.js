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
  // For now, just log the verification code
  // In production, configure MailChannels with proper domain verification
  console.log(`===========================================`);
  console.log(`Verification code for ${email}: ${code}`);
  console.log(`===========================================`);
  
  // TODO: Set up MailChannels with SPF/DKIM records for your domain
  // See: https://support.mailchannels.com/hc/en-us/articles/4565898358413-Configuring-SPF
  
  return true;
}
