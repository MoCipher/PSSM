#!/bin/bash

echo "🚀 Deploying Password Manager to Cloudflare..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Deploy to Cloudflare
echo "☁️ Deploying to Cloudflare Pages + Workers..."
wrangler pages deploy dist --compatibility-date 2024-01-15

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Update wrangler.toml with your KV namespace IDs"
echo "2. Set up your email service API key"
echo "3. Update VITE_API_URL in Cloudflare Pages settings"
echo ""
echo "📚 See README.md for detailed setup instructions"