from http.server import BaseHTTPRequestHandler
import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Security checks
        is_vercel_cron = os.environ.get('VERCEL_CRON') == '1'
        is_development = os.environ.get('NODE_ENV') == 'development'
        
        # Only proceed if it's a Vercel cron job or we're in development
        if not (is_vercel_cron or is_development):
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unauthorized"}).encode('utf-8'))
            return
        
        try:
            # Get the root directory (base of the project)
            root_dir = os.getcwd()
            
            # Ensure the data directory exists
            data_dir = os.path.join(root_dir, 'public', 'data')
            os.makedirs(data_dir, exist_ok=True)
            
            # Check if history.json exists, if not, copy the seed file if available
            history_path = os.path.join(data_dir, 'history.json')
            seed_path = os.path.join(data_dir, 'history.json.seed')
            
            if not os.path.exists(history_path) and os.path.exists(seed_path):
                print('Copying history.json.seed to history.json')
                with open(seed_path, 'r') as seed_file:
                    seed_content = seed_file.read()
                with open(history_path, 'w') as history_file:
                    history_file.write(seed_content)
            
            # Path to the Python script
            script_path = os.path.join(root_dir, 'scripts', 'generate_daily_word.py')
            
            # Check if we need to run the clean_wordlist script first
            wordlist_path = os.path.join(data_dir, 'semantle_wordlist.txt')
            if not os.path.exists(wordlist_path):
                print('Wordlist not found, running clean_wordlist.py first...')
                clean_script_path = os.path.join(root_dir, 'scripts', 'clean_wordlist.py')
                
                # Run the clean_wordlist.py script
                subprocess.run([
                    sys.executable, 
                    clean_script_path, 
                    '--input', os.path.join(root_dir, 'public', 'data', 'wordlist.tsv'),
                    '--output', wordlist_path
                ], check=True)
            
            # Run the generate_daily_word.py script
            print('Running generate_daily_word.py...')
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True,
                text=True,
                check=False
            )
            
            # Check if stderr contains actual errors or just progress output
            stderr = result.stderr
            has_real_error = stderr and \
                not ('UserWarning' in stderr or 'Processing words:' in stderr or 'Computing similarities:' in stderr)
            
            if result.returncode != 0 or has_real_error:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "Failed to generate daily word",
                    "details": stderr
                }).encode('utf-8'))
                return
            
            # Success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Daily word generated successfully",
                "details": result.stdout,
                "stderr": result.stderr
            }).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "Internal server error",
                "details": str(e)
            }).encode('utf-8'))
