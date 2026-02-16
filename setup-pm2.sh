#!/bin/bash

# Setup script to run ON THE SERVER
# This sets up PM2 to keep the frontend running

APP_DIR="/var/www/resume-app"
BACKEND_URL="http://143.198.231.83:3001"

echo "🔧 Setting up PM2 service for frontend..."

cd $APP_DIR

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_RESUME_BACKEND_URL=$BACKEND_URL
NODE_ENV=production
PORT=3002

# Optional: For LinkedIn scraping feature
# APIFY_API_TOKEN=your_apify_token_here

# Optional: For client-side AI features (if not using backend)
# GEMINI_API_KEY=your_gemini_key_here
# OPENAI_API_KEY=your_openai_key_here
EOF
    echo "✅ Created .env.local"
    echo "⚠️  Note: Add APIFY_API_TOKEN if you want LinkedIn scraping feature"
fi

# Start the app with PM2
pm2 start npm --name resume-app -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot (if not already done)
pm2 startup

echo "✅ PM2 service setup complete!"
echo "📝 Useful commands:"
echo "   pm2 status                    # Check status"
echo "   pm2 restart resume-app        # Restart service"
echo "   pm2 stop resume-app           # Stop service"
echo "   pm2 logs resume-app           # View logs"
echo "   pm2 monit                     # Monitor resources"
