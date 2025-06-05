#!/bin/bash
# Vercel Deployment Script for WebApp
# Run this script to deploy your Next.js application to Vercel

echo "🚀 Starting Vercel Deployment Process..."

# Step 1: Login to Vercel (if not already logged in)
echo "📝 Step 1: Login to Vercel"
echo "Run: vercel login"
echo "Follow the prompts to authenticate with your Vercel account"

# Step 2: Link the project to Vercel
echo "🔗 Step 2: Link project to Vercel"
echo "Run: vercel link"
echo "This will connect your local project to a Vercel project"

# Step 3: Deploy to Vercel
echo "🌐 Step 3: Deploy to Vercel"
echo "Run: vercel --prod"
echo "This will deploy your application to production"

# Alternative: One-command deployment
echo ""
echo "⚡ Quick Deployment:"
echo "Run: vercel"
echo "This will automatically deploy to a preview URL"

echo ""
echo "🎯 Your project is ready for deployment!"
echo "Configuration files created:"
echo "  ✅ vercel.json - Deployment configuration"
echo "  ✅ .vercelignore - Files to exclude from deployment"
echo ""
echo "📋 Manual Deployment Steps:"
echo "1. Open terminal in project directory"
echo "2. Run: vercel login"
echo "3. Run: vercel"
echo "4. Follow the prompts"
echo "5. Your app will be deployed and you'll get a live URL!"