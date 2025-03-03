#!/bin/bash

# Script to deploy daily data to Vercel
# Usage: ./deploy_daily_data.sh

# Exit on error
set -e

echo "Deploying daily data to Vercel..."

# Create a temporary deployment directory
mkdir -p deploy/public/data

# Copy the generated data files
cp public/data/daily.json deploy/public/data/
cp public/data/history.json deploy/public/data/

# Deploy to Vercel
cd deploy
vercel --prod

echo "Deployment complete!"
