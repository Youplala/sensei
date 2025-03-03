# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Sensei project.

## Daily Word Generation

The `daily-word-generation.yml` workflow is responsible for generating the daily word for the Sensei game. It runs every day at midnight UTC and performs the following steps:

1. Checks out the code
2. Sets up Python
3. Installs dependencies
4. Runs the `generate_daily_word.py` script to generate the daily word
5. Deploys the generated data files to Vercel

### Required Secrets

To use this workflow, you need to set up the following secrets in your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `VERCEL_ORG_ID`: Your Vercel organization ID

### Manual Triggering

You can also trigger this workflow manually from the GitHub Actions tab by clicking on "Run workflow".

## Setting Up Vercel Deployment

To set up the Vercel deployment for the data files:

1. Create a Vercel account if you don't have one
2. Install the Vercel CLI: `npm install -g vercel`
3. Log in to Vercel: `vercel login`
4. Get your Vercel token, project ID, and organization ID
5. Add these as secrets to your GitHub repository

## Security Considerations

The workflow is designed to keep the daily word and similarities secure by:

1. Only deploying the necessary data files
2. Using GitHub secrets for sensitive information
3. Restricting access to the workflow logs
