import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/passwords.js';
import { authenticateToken } from './middleware/auth.js';
import { config } from '../config.js';

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/passwords', authenticateToken, passwordRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});