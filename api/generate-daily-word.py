from http.server import BaseHTTPRequestHandler
import sys
import os
import json
import datetime
import shutil
from pathlib import Path

# Add the scripts directory to the Python path so we can import the generate_daily_word module
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scripts_dir = os.path.join(root_dir, 'scripts')
sys.path.append(scripts_dir)

# Import the generate_daily_word module
import generate_daily_word

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Check authorization (similar to what we do in the TypeScript version)
            is_vercel_cron = os.environ.get('VERCEL_CRON') == '1'
            is_development = os.environ.get('NODE_ENV') == 'development'
            
            # For simplicity, we'll allow the function to run in development or when triggered by Vercel cron
            if not (is_vercel_cron or is_development):
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                return
            
            # Ensure the data directory exists
            data_dir = os.path.join(root_dir, 'public', 'data')
            os.makedirs(data_dir, exist_ok=True)
            
            # Check if history.json exists, if not, copy the seed file if available
            history_path = os.path.join(data_dir, 'history.json')
            seed_path = os.path.join(data_dir, 'history.json.seed')
            
            if not os.path.exists(history_path) and os.path.exists(seed_path):
                print('Copying history.json.seed to history.json')
                shutil.copyfile(seed_path, history_path)
            
            # Run the generate_daily_word functionality directly
            date_str = datetime.datetime.now().strftime('%Y-%m-%d')
            
            # Load wordlist
            wordlist_path = os.path.join(data_dir, 'semantle_wordlist.txt')
            wordlist = generate_daily_word.load_wordlist(wordlist_path)
            
            # Load history
            history = generate_daily_word.load_history(history_path)
            
            # Pick a daily word
            daily_word = generate_daily_word.pick_daily_word(wordlist, history, date_str)
            
            # Update history
            generate_daily_word.update_history(history, date_str, daily_word, history_path)
            
            # Compute similarities
            nlp = generate_daily_word.load_spacy_model()
            similarities = generate_daily_word.compute_similarities(nlp, daily_word, wordlist, 0.3)
            
            # Save daily word and similarities
            daily_path = os.path.join(data_dir, 'daily.json')
            generate_daily_word.save_daily_word(daily_word, similarities, date_str, daily_path)
            
            # Return success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': f'Daily word generated for {date_str}',
                'word': daily_word
            }).encode('utf-8'))
            
        except Exception as e:
            # Handle errors
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Failed to generate daily word',
                'details': str(e)
            }).encode('utf-8'))
