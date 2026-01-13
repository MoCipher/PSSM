import { TOTP } from 'otpauth';

export const generateTOTP = (secret: string): string => {
  try {
    // Trim and clean the secret
    const cleaned = secret.trim().replace(/\s+/g, '');
    const totp = new TOTP({
      secret: cleaned,
    });
    return totp.generate();
  } catch (error) {
    throw new Error('Invalid 2FA secret');
  }
};

export const generateTOTPQRCode = (secret: string, issuer: string, account: string): string => {
  // Trim and clean the secret
  const cleaned = secret.trim().replace(/\s+/g, '');
  const totp = new TOTP({
    secret: cleaned,
    issuer: issuer,
    label: account,
  });
  return totp.toString();
};

export const validateSecret = (secret: string): boolean => {
  if (!secret || !secret.trim()) {
    return false;
  }
  
  try {
    // Trim whitespace and try to create TOTP
    const trimmed = secret.trim().replace(/\s+/g, '');
    new TOTP({ secret: trimmed });
    return true;
  } catch {
    return false;
  }
};
