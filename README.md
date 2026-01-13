# Password Manager

A secure, client-side password manager with 2FA support, export/import functionality, and master password protection.

## Features

- 🔐 Master password protection
- 🔑 Secure password storage with encryption
- 📤 Export passwords (JSON/CSV)
- 📥 Import passwords (JSON/CSV)
- 🔒 2FA (TOTP) support for all passwords
- 💾 Client-side storage (no server required)

## Development

```bash
npm install
npm run dev
```

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

1. **First Time Setup**: Create a master password (minimum 8 characters)
2. **Add Passwords**: Click "Add Password" and fill in the details
3. **Enable 2FA**: Check "Enable 2FA" and enter your TOTP secret (base32 format)
4. **Copy Credentials**: Click the 📋 icon next to any field to copy to clipboard
5. **Export/Import**: Use the Export/Import menu to backup or restore your passwords
6. **2FA Codes**: 2FA codes are automatically generated and can be refreshed

## Security Notes

- All passwords are encrypted client-side using AES-256 encryption
- Master password is never stored (only a hash is saved)
- 2FA secrets are encrypted along with passwords
- All data is stored locally in your browser's localStorage
- No data is sent to any server - everything runs client-side
- Remember to export your passwords regularly as a backup!

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CryptoJS** - Encryption library
- **otpauth** - TOTP/2FA implementation
