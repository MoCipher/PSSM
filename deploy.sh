#!/bin/bash

echo "🚀 Deploying Password Manager to Cloudflare (Pages + Functions + D1)..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Deploy to Cloudflare Pages + Functions
echo "☁️ Deploying to Cloudflare Pages with Functions..."
wrangler pages deploy dist

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Create D1 database and run schema.sql"
echo "2. Configure email service API key in Pages settings"
echo "3. Test your app at the deployed URL"
echo ""
echo "📚 See README.md for detailed setup instructions"