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

For email verification to work, configure your email settings in `backend/.env`:

```bash
# Email settings for verification codes
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: Verification code expiry (default: 300000ms = 5 minutes)
VERIFICATION_CODE_EXPIRY=300000
```

### Gmail Setup:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use your Gmail address as EMAIL_USER and the App Password as EMAIL_PASS

## Build

```bash
npm run build
```

## Deploy to Cloudflare Pages

### Option 1: Via Git Integration (Recommended)

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to Cloudflare Dashboard → Pages → Create a project
3. Connect your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)
5. Click "Save and Deploy"

### Option 2: Via Wrangler CLI

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist
```

### Option 3: Manual Upload

1. Build the project: `npm run build`
2. Go to Cloudflare Dashboard → Pages → Create a project → Upload assets
3. Upload the contents of the `dist` folder
4. Deploy!

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
