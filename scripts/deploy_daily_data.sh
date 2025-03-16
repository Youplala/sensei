#!/bin/bash

# Script to deploy daily data to Vercel
# Usage: ./deploy_daily_data.sh

# Exit on error
set -e

echo "Deploying daily data to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "Warning: VERCEL_TOKEN environment variable not set."
    echo "You may need to authenticate manually."
fi

# Create a temporary deployment directory
mkdir -p deploy/public/data

# Copy the generated data files
echo "Copying data files..."
cp public/data/daily.json deploy/public/data/
cp public/data/history.json deploy/public/data/

# Deploy to Vercel
echo "Deploying to Vercel..."
cd deploy
vercel --prod --yes || vercel --prod

echo "Deployment complete!"

# Clean up
echo "Cleaning up..."
cd ..
rm -rf deploy

echo "All done!"
