# Deploying Daily Data to Vercel

This document explains how to deploy the daily word data to a running Vercel instance.

## Automatic Deployment with GitHub Actions

The daily word data is automatically generated and deployed to Vercel using GitHub Actions. The workflow is defined in `.github/workflows/daily-word-generation.yml`.

### How It Works

1. The GitHub Action runs daily at midnight UTC
2. It executes the Python script to generate the daily word and similarities
3. It creates a minimal deployment package containing only the data files
4. It deploys this package to Vercel using the Vercel CLI

### Required Secrets

To use this workflow, you need to set up the following secrets in your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `VERCEL_ORG_ID`: Your Vercel organization ID

## Manual Deployment

If you need to deploy the daily data manually, follow these steps:

### Prerequisites

- Vercel CLI installed: `npm install -g vercel`
- Logged in to Vercel: `vercel login`

### Steps

1. Generate the daily word data:
   ```bash
   python scripts/generate_daily_word.py
   ```

2. Create a temporary deployment directory:
   ```bash
   mkdir -p deploy/public/data
   ```

3. Copy the generated data files:
   ```bash
   cp public/data/daily.json deploy/public/data/
   cp public/data/history.json deploy/public/data/
   ```

4. Deploy to Vercel:
   ```bash
   cd deploy
   vercel --prod
   ```

## Security Considerations

The API is designed to keep the daily word and similarities secure:

1. The API endpoint `/api/daily-word` only returns the date and a hash of the word, not the actual word or similarities
2. Guesses are verified server-side using the `/api/verify-guess` endpoint
3. The actual word and similarities are never exposed in the network panel

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions logs for any errors
2. Verify that your Vercel secrets are correctly set up
3. Try deploying manually to see if there are any issues with the Vercel CLI
4. Check the Vercel deployment logs for any errors
