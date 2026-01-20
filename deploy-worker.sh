#!/bin/bash

echo "⚙️ Deploying Password Manager Backend Worker..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Deploy worker
cd backend
wrangler deploy --config wrangler-worker.toml

echo "✅ Worker deployed!"
echo ""
echo "🔗 Your worker URL will be shown above (something like: https://password-manager-backend.your-subdomain.workers.dev)"
echo ""
echo "📝 Next: Set VITE_API_URL in your Cloudflare Pages environment variables to:"
echo "VITE_API_URL=https://password-manager-backend.your-subdomain.workers.dev/api"