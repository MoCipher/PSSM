# Password Manager Backend

This is the backend API for the password manager application, providing user authentication and password synchronization across devices.

## Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify JWT token

### Passwords
- `GET /api/passwords` - Get all passwords for authenticated user
- `POST /api/passwords/sync` - Sync passwords with server
- `PUT /api/passwords/:id` - Update specific password
- `DELETE /api/passwords/:id` - Delete specific password

## Data Storage

The backend currently uses JSON file storage for simplicity:
- `data/users.json` - User accounts and authentication data
- `data/passwords.json` - Encrypted password data per user

In production, these should be replaced with a proper database.

## Environment Variables

Create a `.env` file in the backend directory with:
```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Security Notes

- Passwords are hashed with bcrypt
- JWT tokens are used for authentication
- All API endpoints (except auth) require valid JWT tokens
- Change the JWT_SECRET in production