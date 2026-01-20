#!/bin/bash

echo "🚀 Deploying Password Manager to Cloudflare (Pages + Worker)..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Deploy Worker first
echo "⚙️ Deploying backend worker..."
cd backend
wrangler deploy

# Get worker URL
WORKER_URL=$(wrangler deploy --dry-run 2>/dev/null | grep "https://" | head -1)
if [ -z "$WORKER_URL" ]; then
    WORKER_URL="https://password-manager-backend.your-subdomain.workers.dev"
fi

echo "🔗 Worker deployed at: $WORKER_URL"

# Deploy Pages
echo "📄 Deploying frontend to Pages..."
cd ..
wrangler pages deploy dist --compatibility-date 2024-01-15

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Set VITE_API_URL=$WORKER_URL/api in Cloudflare Pages environment variables"
echo "2. Update KV namespace IDs in backend/wrangler-worker.toml"
echo "3. Configure your email service API key in Worker settings"
echo ""
echo "📚 See README.md for detailed setup instructions"