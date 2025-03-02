# Semantle Daily Word Generation System

This system automatically generates a daily word and computes semantic similarities for a Semantle-like game. It is designed to be deployed with Vercel and run as a daily cron job.

## Components

1. **clean_wordlist.py**: Filters a wordlist to get words suitable for a Semantle game
2. **generate_daily_word.py**: Picks a random word and computes similarities with all other words
3. **deploy_daily_word.sh**: Shell script to run the generation process
4. **API Route**: Next.js API route that can be triggered by Vercel cron

## Setup Instructions

### 1. Prepare the Wordlist

First, run the script to clean the wordlist and get words suitable for Semantle:

```bash
cd /path/to/project
source venv/bin/activate
python scripts/clean_wordlist.py
```

This will create a file at `public/data/semantle_wordlist.txt` with filtered words.

### 2. Generate Daily Word

To manually generate a daily word and compute similarities:

```bash
python scripts/generate_daily_word.py
```

This will:
- Pick a random word from the filtered wordlist
- Compute semantic similarities using spaCy
- Save the results to `public/data/daily.json`
- Update the history in `public/data/history.json`

### 3. Vercel Deployment

#### Environment Setup

Make sure your Vercel project has the following:

1. **Python Runtime**: Set up the Python runtime in your Vercel project
2. **Environment Variables**:
   - `CRON_SECRET_KEY`: A secret key to protect the API endpoint

#### Cron Job Configuration

The `vercel.json` file includes a cron job configuration that will trigger the API endpoint daily at midnight:

```json
{
  "crons": [
    {
      "path": "/api/generate-daily-word",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 4. Alternative: Manual Deployment

If you prefer to run the script locally and deploy the results:

1. Make the deployment script executable:
   ```bash
   chmod +x scripts/deploy_daily_word.sh
   ```

2. Run the deployment script:
   ```bash
   ./scripts/deploy_daily_word.sh
   ```

3. Set up a cron job on your local machine or server:
   ```
   0 0 * * * /path/to/project/scripts/deploy_daily_word.sh
   ```

## Security

The daily word generation API endpoint is secured to prevent unauthorized access:

1. **Vercel Cron Authentication**: 
   - Vercel's cron jobs are automatically authenticated
   - The API checks for the `VERCEL_CRON=1` environment variable that Vercel sets
   - This is the most secure way to trigger the API, as it's handled internally by Vercel

2. **API Key Authentication** (for manual triggers):
   - For manual API calls, the endpoint requires a valid authorization token
   - Set the `CRON_SECRET_KEY` environment variable in your Vercel project settings
   - Include this key in the Authorization header: `Authorization: Bearer your-secret-key`

3. **IP Filtering** (optional):
   - You can restrict access to specific IP addresses
   - Set the `ALLOWED_IPS` environment variable to a comma-separated list of allowed IPs
   - Manual API calls must come from an allowed IP AND have a valid API key

4. **Rate Limiting**:
   - The API has basic rate limiting to prevent abuse
   - Non-cron requests are limited to once per hour

5. **Privacy-Preserving Logging**:
   - IP addresses of unauthorized attempts are hashed before logging
   - This protects user privacy while still allowing for security monitoring

### Setting Up Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `CRON_SECRET_KEY`: A secure random string (e.g., generate with `openssl rand -hex 32`)
   - `ALLOWED_IPS` (optional): Comma-separated list of allowed IP addresses

### Testing the API Manually

To manually trigger the API (for testing purposes):

```bash
curl -X GET "https://your-vercel-app.vercel.app/api/generate-daily-word" \
  -H "Authorization: Bearer your-secret-key"
```

Replace `your-secret-key` with the value of your `CRON_SECRET_KEY` environment variable.

## File Structure

- `public/data/semantle_wordlist.txt`: Filtered wordlist suitable for Semantle
- `public/data/daily.json`: Daily word and similarities
- `public/data/history.json`: History of past daily words
- `scripts/clean_wordlist.py`: Script to filter the wordlist
- `scripts/generate_daily_word.py`: Script to generate daily word and similarities
- `scripts/deploy_daily_word.sh`: Shell script for deployment
- `src/app/api/generate-daily-word/route.ts`: API route for Vercel cron

## Customization

You can customize the generation process by passing arguments to the script:

```bash
python scripts/generate_daily_word.py --min-similarity 0.4 --top-similar 500
```

Available options:
- `--wordlist`: Path to the filtered wordlist
- `--output`: Path to save the daily word data
- `--history`: Path to the history file
- `--date`: Generate for a specific date (YYYY-MM-DD)
- `--min-similarity`: Minimum similarity threshold (default: 0.3)
- `--top-similar`: Number of top similar words to keep (default: 1000)

## Notes

- The system uses spaCy's French language model (`fr_core_news_lg`) for computing similarities
- Words are normalized to a 0-100 scale for easier interpretation
- The history file prevents the same word from being used again in the next 100 days
