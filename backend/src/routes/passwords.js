import express from 'express';
import { getUserPasswords, saveUserPasswords } from '../utils/storage.js';

const router = express.Router();

// Get all passwords for the authenticated user
router.get('/', (req, res) => {
  try {
    const userId = req.user.userId;
    const passwords = getUserPasswords(userId);
    res.json({ passwords });
  } catch (error) {
    console.error('Error getting passwords:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync passwords (replace all passwords for the user)
router.post('/sync', (req, res) => {
  try {
    const userId = req.user.userId;
    const { passwords, lastSyncTimestamp } = req.body;

    if (!Array.isArray(passwords)) {
      return res.status(400).json({ error: 'Passwords must be an array' });
    }

    // Validate password entries
    for (const password of passwords) {
      if (!password.id || !password.name) {
        return res.status(400).json({ error: 'Invalid password entry format' });
      }
    }

    // Save passwords
    saveUserPasswords(userId, passwords);

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      count: passwords.length
    });
  } catch (error) {
    console.error('Error syncing passwords:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update specific password (for real-time sync)
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const passwordId = req.params.id;
    const updateData = req.body;

    const passwords = getUserPasswords(userId);
    const passwordIndex = passwords.findIndex(p => p.id === passwordId);

    if (passwordIndex === -1) {
      return res.status(404).json({ error: 'Password not found' });
    }

    // Update the password
    passwords[passwordIndex] = {
      ...passwords[passwordIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    saveUserPasswords(userId, passwords);

    res.json({
      success: true,
      password: passwords[passwordIndex]
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete specific password
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const passwordId = req.params.id;

    const passwords = getUserPasswords(userId);
    const filteredPasswords = passwords.filter(p => p.id !== passwordId);

    if (filteredPasswords.length === passwords.length) {
      return res.status(404).json({ error: 'Password not found' });
    }

    saveUserPasswords(userId, filteredPasswords);

    res.json({
      success: true,
      deletedId: passwordId
    });
  } catch (error) {
    console.error('Error deleting password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;