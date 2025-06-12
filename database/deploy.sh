#!/bin/bash

# PocketBase Fly.io Deployment Script
echo "🚀 Deploying PocketBase to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please log in to Fly.io first:"
    echo "   flyctl auth login"
    exit 1
fi

# Create the app if it doesn't exist
echo "📝 Checking if app exists..."
if ! flyctl apps show life-manager-pocketbase &> /dev/null; then
    echo "🆕 Creating new Fly.io app..."
    flyctl apps create life-manager-pocketbase
fi

# Create volume if it doesn't exist
echo "💾 Setting up persistent volume..."
if ! flyctl volumes show pb_data -a life-manager-pocketbase &> /dev/null; then
    echo "🗄️ Creating persistent volume for database..."
    flyctl volumes create pb_data --region dfw --size 3 -a life-manager-pocketbase
fi

# Deploy the app
echo "🚀 Deploying PocketBase..."
flyctl deploy

# Show the app URL
echo "✅ Deployment complete!"
echo "🌐 Your PocketBase URL: https://life-manager-pocketbase.fly.dev"
echo "🔧 Admin panel: https://life-manager-pocketbase.fly.dev/_/"
echo ""
echo "💡 First time setup:"
echo "   1. Visit the admin panel to create your admin account"
echo "   2. Update your Railway API environment variables:"
echo "      POCKETBASE_URL=https://life-manager-pocketbase.fly.dev"
echo "      POCKETBASE_ADMIN_EMAIL=your_admin_email"
echo "      POCKETBASE_ADMIN_PASSWORD=your_admin_password" 