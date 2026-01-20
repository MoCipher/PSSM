#!/bin/bash

echo "🔧 Setting up Cloudflare KV Namespaces for Password Manager..."

echo "Creating USERS namespace..."
USERS_ID=$(wrangler kv:namespace create "USERS" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating PASSWORDS namespace..."
PASSWORDS_ID=$(wrangler kv:namespace create "PASSWORDS" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating VERIFICATION_CODES namespace..."
CODES_ID=$(wrangler kv:namespace create "VERIFICATION_CODES" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo ""
echo "✅ KV Namespaces created!"
echo ""
echo "📝 Update backend/wrangler-worker.toml with these IDs:"
echo ""
echo "[[kv_namespaces]]"
echo "binding = \"USERS\""
echo "id = \"$USERS_ID\""
echo "preview_id = \"$USERS_ID\""
echo ""
echo "[[kv_namespaces]]"
echo "binding = \"PASSWORDS\""
echo "id = \"$PASSWORDS_ID\""
echo "preview_id = \"$PASSWORDS_ID\""
echo ""
echo "[[kv_namespaces]]"
echo "binding = \"VERIFICATION_CODES\""
echo "id = \"$CODES_ID\""
echo "preview_id = \"$CODES_ID\""