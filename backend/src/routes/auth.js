import express from 'express';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser, updateUserLastLogin } from '../utils/storage.js';
import { sendVerificationEmail, storeVerificationCode, verifyCode } from '../utils/email.js';
import { config } from '../../config.js';

const router = express.Router();
const JWT_SECRET = config.jwtSecret;

// Send registration verification code
router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Generate and send verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await sendVerificationEmail(email, verificationCode);
    storeVerificationCode(email, verificationCode);

    res.json({
      message: 'Verification code sent to your email',
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify registration code
router.post('/register/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Verify the code
    if (!verifyCode(email, code)) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // Create user (no password needed)
    const user = createUser(email, '');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send login verification code
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if user exists
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address' });
    }

    // Generate and send verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await sendVerificationEmail(email, verificationCode);
    storeVerificationCode(email, verificationCode);

    res.json({
      message: 'Verification code sent to your email',
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify login code
router.post('/login/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address' });
    }

    // Verify the code
    if (!verifyCode(email, code)) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // Update last login
    updateUserLastLogin(email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint (for checking if token is still valid)
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({
        valid: true,
        user: {
          userId: decoded.userId,
          email: decoded.email
        }
      });
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;