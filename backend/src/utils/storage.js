import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../../data/users.json');
const PASSWORDS_FILE = path.join(__dirname, '../../data/passwords.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}

if (!fs.existsSync(PASSWORDS_FILE)) {
  fs.writeFileSync(PASSWORDS_FILE, JSON.stringify({}));
}

// User storage functions
export const getUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return {};
  }
};

export const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users file:', error);
    throw error;
  }
};

export const getUserByEmail = (email) => {
  const users = getUsers();
  return users[email.toLowerCase()] || null;
};

export const createUser = (email, hashedPassword) => {
  const users = getUsers();
  const user = {
    id: crypto.lib.WordArray.random(16).toString(),
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  users[email.toLowerCase()] = user;
  saveUsers(users);
  return user;
};

export const updateUserLastLogin = (email) => {
  const users = getUsers();
  if (users[email.toLowerCase()]) {
    users[email.toLowerCase()].lastLogin = new Date().toISOString();
    saveUsers(users);
  }
};

// Password storage functions
export const getUserPasswords = (userId) => {
  try {
    const data = fs.readFileSync(PASSWORDS_FILE, 'utf8');
    const allPasswords = JSON.parse(data);
    return allPasswords[userId] || [];
  } catch (error) {
    console.error('Error reading passwords file:', error);
    return [];
  }
};

export const saveUserPasswords = (userId, passwords) => {
  try {
    const data = fs.readFileSync(PASSWORDS_FILE, 'utf8');
    const allPasswords = JSON.parse(data);
    allPasswords[userId] = passwords;
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(allPasswords, null, 2));
  } catch (error) {
    console.error('Error saving passwords file:', error);
    throw error;
  }
};