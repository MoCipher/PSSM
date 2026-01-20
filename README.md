# Password Manager

A secure password manager with email-based authentication, device synchronization, 2FA support, and export/import functionality.

## Features

- 📧 Email-only authentication with verification codes
- 🔄 Automatic sync across devices
- 🔐 Secure password storage with encryption
- 📤 Export passwords (JSON/CSV)
- 📥 Import passwords (JSON/CSV)
- 🔒 2FA (TOTP) support for all passwords
- ☁️ Cloud storage with local caching

## Development

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:3001` and the frontend on `http://localhost:5173`.

## Email Configuration

Configure any email service in your Cloudflare Worker environment variables:

### Option 1: SendGrid (Recommended)
```bash
EMAIL_FROM=noreply@yourdomain.com
EMAIL_API_KEY=your-sendgrid-api-key
```

### Option 2: Mailgun
```bash
EMAIL_FROM=noreply@yourdomain.com
EMAIL_API_KEY=your-mailgun-api-key
```

### Custom Email Service
Update the `sendVerificationEmail` function in `utils/auth.js` to integrate with your preferred email service.

### Setting Environment Variables:
In Cloudflare Pages settings → Environment variables, add your email configuration.

## Build

```bash
npm run build
```

## Deploy to Cloudflare (Complete Full-Stack)

This app runs **entirely on Cloudflare** using Pages + Functions + D1 Database!

### Quick Deploy

```bash
# One-command deployment
./deploy.sh
```

### Manual Setup

**1. Install Wrangler CLI:**
```bash
npm install -g wrangler
wrangler auth login
```

**2. Create D1 Database:**
```bash
# Create database
wrangler d1 create password-manager-db

# Run schema
wrangler d1 execute password-manager-db --file=schema.sql
```

**3. Update wrangler.toml:**
Replace `your-database-id` with your actual D1 database ID from step 2.

**4. Deploy:**
```bash
npm run build
wrangler pages deploy dist

**3. Set Up KV Namespaces:**
```bash
# Create storage namespaces for the worker
wrangler kv:namespace create "USERS"
wrangler kv:namespace create "PASSWORDS"
wrangler kv:namespace create "VERIFICATION_CODES"

# Copy the returned IDs to backend/wrangler-worker.toml
```

**4. Configure Environment Variables:**
In Cloudflare Pages settings, add:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EMAIL_FROM=noreply@yourdomain.com
EMAIL_API_KEY=your-email-service-api-key
```

**5. Deploy:**
```bash
npm run build
wrangler pages deploy dist
```
```

### Automated GitHub Actions deployment

This repository includes a GitHub Actions workflow that builds the project and publishes the `./dist` folder to Cloudflare Pages using `wrangler`.

Required repository secrets (Settings → Secrets):

- `CF_API_TOKEN` — a Cloudflare API token with Pages deploy permissions.
- `CF_PAGES_PROJECT_NAME` — the Pages project name used by `wrangler pages publish`.
- `CF_ACCOUNT_ID` — optional: your Cloudflare account id. If not provided, the workflow will attempt to detect it using `wrangler whoami`.

The workflow will auto-generate a minimal `wrangler.toml` at runtime, so you don't need to commit sensitive account ids.

To test a publish locally (requires `wrangler` and Node installed):

```bash
# build the site
npm run build

# then publish locally with your env vars set
CF_API_TOKEN=... CF_PAGES_PROJECT_NAME=... CF_ACCOUNT_ID=... wrangler pages publish ./dist --project-name "$CF_PAGES_PROJECT_NAME" --branch main
```

## Usage

1. **Account Setup**: Enter your email address and we'll send you a verification code
2. **Verify Email**: Enter the 6-digit code sent to your email to complete setup
3. **Device Sync**: Your passwords automatically sync across all your devices
4. **Add Passwords**: Click "Add Password" and fill in the details
5. **Enable 2FA**: Check "Enable 2FA" and enter your TOTP secret (base32 format)
6. **Copy Credentials**: Click the 📋 icon next to any field to copy to clipboard
7. **Export/Import**: Use the Export/Import menu to backup or restore your passwords
8. **2FA Codes**: 2FA codes are automatically generated and can be refreshed

## Security Notes

- All passwords are encrypted client-side using AES-256 encryption
- Email verification codes provide secure authentication
- JWT tokens are used for API authentication
- 2FA secrets are encrypted along with passwords
- Password data is stored encrypted on the server
- End-to-end encryption ensures only you can access your passwords
- Automatic sync keeps your devices in sync securely
- Verification codes expire after 5 minutes for security

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CryptoJS** - Encryption library
- **otpauth** - TOTP/2FA implementation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-origin support
