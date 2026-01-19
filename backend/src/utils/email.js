import nodemailer from 'nodemailer';
import { config } from '../../config.js';

const transporter = nodemailer.createTransporter({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.auth
});

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeVerificationCode = (email, code) => {
  const expiryTime = Date.now() + config.verificationCodeExpiry;
  verificationCodes.set(email.toLowerCase(), {
    code,
    expiry: expiryTime
  });

  // Clean up expired codes every 5 minutes
  setTimeout(() => {
    verificationCodes.delete(email.toLowerCase());
  }, config.verificationCodeExpiry);
};

export const verifyCode = (email, code) => {
  const stored = verificationCodes.get(email.toLowerCase());
  if (!stored) return false;

  if (Date.now() > stored.expiry) {
    verificationCodes.delete(email.toLowerCase());
    return false;
  }

  return stored.code === code;
};

export const sendVerificationEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: config.email.auth.user,
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
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const cleanupExpiredCodes = () => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiry) {
      verificationCodes.delete(email);
    }
  }
};

// Clean up expired codes every minute
setInterval(cleanupExpiredCodes, 60000);