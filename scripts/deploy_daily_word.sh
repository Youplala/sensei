#!/bin/bash
# Script to generate daily word and deploy to Vercel
# This script should be run as a daily cron job

# Set environment variables
export PATH="/usr/local/bin:$PATH"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PYTHON_VENV="$PROJECT_DIR/venv"

# Activate virtual environment
source "$PYTHON_VENV/bin/activate"

# Generate daily word and similarities
echo "Generating daily word and similarities..."
python "$SCRIPT_DIR/generate_daily_word.py"

# If you're using Vercel, you might want to commit and push the changes
# Uncomment the following lines if you want to automatically commit and push

# cd "$PROJECT_DIR"
# git add public/data/daily.json public/data/history.json
# git commit -m "Update daily word for $(date +%Y-%m-%d)"
# git push

echo "Daily word generation complete!"

# Alternatively, you can use Vercel CLI to deploy directly
# vercel --prod

# Deactivate virtual environment
deactivate
