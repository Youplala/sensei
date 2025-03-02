import os
import sys
import json
import subprocess
from http.server import BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Set CORS headers for preflight requests
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # Get the root directory
            root_dir = os.getcwd()
            
            # Path to the Python script
            script_path = os.path.join(root_dir, 'scripts', 'generate_daily_word.py')
            
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
            
            # Check if we need to run the clean_wordlist script first
            wordlist_path = os.path.join(data_dir, 'semantle_wordlist.txt')
            if not os.path.exists(wordlist_path):
                print('Wordlist not found, running clean_wordlist.py first...')
                clean_script_path = os.path.join(root_dir, 'scripts', 'clean_wordlist.py')
                
                # Run the clean_wordlist.py script directly with Python's subprocess
                subprocess.run([sys.executable, clean_script_path, 
                               '--input', os.path.join(root_dir, 'public', 'data', 'wordlist.tsv'),
                               '--output', wordlist_path])
            
            # Run the generate_daily_word.py script directly with Python's subprocess
            print('Running generate_daily_word.py...')
            result = subprocess.run([sys.executable, script_path], 
                                   capture_output=True, text=True)
            
            stdout = result.stdout
            stderr = result.stderr
            
            # Check if stderr contains actual errors or just progress output
            has_real_error = stderr and \
                not ('UserWarning' in stderr) and \
                not ('Processing words:' in stderr) and \
                not ('Loaded' in stderr)
            
            if has_real_error:
                print(f"Error executing Python script: {stderr}")
                response = {
                    'error': 'Failed to generate daily word',
                    'details': stderr,
                    'command': f"{sys.executable} {script_path}",
                    'cwd': os.getcwd()
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Success response
            response = {
                'success': True,
                'message': 'Daily word generated successfully',
                'output': stdout
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"Exception: {str(e)}")
            response = {
                'error': 'Failed to execute Python script',
                'details': str(e),
                'command': f"{sys.executable} {script_path}" if 'script_path' in locals() else None,
                'cwd': os.getcwd(),
                'path': os.environ.get('PATH')
            }
            self.wfile.write(json.dumps(response).encode())
