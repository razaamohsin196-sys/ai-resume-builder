#!/bin/bash

# Deployment script for Digital Ocean Frontend
# Run this script on your local machine to deploy to the server

SERVER_IP="143.198.231.83"
SERVER_USER="root"
APP_DIR="/var/www/resume-app"
BACKEND_URL="http://143.198.231.83:3001"

echo "🚀 Starting frontend deployment to Digital Ocean..."

# Build the project locally with production backend URL
echo "📦 Building the project with production backend URL..."
cd "$(dirname "$0")"
NEXT_PUBLIC_RESUME_BACKEND_URL=$BACKEND_URL npm run build

# Create deployment archive (include .next, public, package.json, etc.)
echo "📦 Creating deployment archive..."
tar -czf deploy.tar.gz .next public package.json package-lock.json next.config.ts tsconfig.json

# Upload to server
echo "📤 Uploading to server..."
scp deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# SSH into server and deploy
echo "🔧 Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << ENDSSH
    # Create app directory if it doesn't exist
    mkdir -p $APP_DIR
    
    # Extract files
    cd $APP_DIR
    tar -xzf /tmp/deploy.tar.gz
    
    # Install/update dependencies (Next.js needs all deps for production)
    npm install
    
    # Update .env.local file with correct port
    echo "📝 Updating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_RESUME_BACKEND_URL=$BACKEND_URL
NODE_ENV=production
PORT=3002
EOF
    echo "✅ Updated .env.local with backend URL: $BACKEND_URL and PORT: 3002"
    
    # Delete old PM2 process if exists, then start fresh
    pm2 delete resume-app 2>/dev/null || true
    pm2 start npm --name resume-app -- start
    pm2 save
    
    # Cleanup
    rm /tmp/deploy.tar.gz
    
    echo "✅ Deployment complete!"
ENDSSH

# Cleanup local archive
rm deploy.tar.gz

echo "✅ Frontend deployment finished!"
