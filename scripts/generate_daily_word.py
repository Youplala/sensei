#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate a daily word and compute similarities for Semantle game.

This script:
1. Loads a list of filtered words suitable for Semantle
2. Picks a random word as the daily target
3. Computes similarity scores between the target and all other words using spaCy
4. Stores the results in a JSON file that can be used by the frontend
5. Creates a history file to track past daily words

Designed to be run as a daily cron job in a production environment deployed with Vercel.
"""

import spacy
import json
import random
import datetime
import argparse
import os
from pathlib import Path
from tqdm import tqdm

# Constants
DEFAULT_MIN_SIMILARITY = -0.5  # Only store words with similarity above this threshold
DEFAULT_TOP_SIMILAR = 10000    # Store top N most similar words

def load_wordlist(file_path):
    """Load words from a text file, one word per line."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]

def get_date_string(date=None):
    """Get date string in YYYY-MM-DD format."""
    if date is None:
        date = datetime.datetime.now()
    return date.strftime('%Y-%m-%d')

def load_history(history_file):
    """Load history of past daily words."""
    if not os.path.exists(history_file):
        # Try to use the seed file if it exists
        seed_file = f"{history_file}.seed"
        if os.path.exists(seed_file):
            print(f"History file not found. Using seed file: {seed_file}")
            with open(seed_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        # If no seed file, return an empty dictionary
        print(f"No history file found. Starting with empty history.")
        return {}
    
    with open(history_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def update_history(history_file, history, date, word):
    """Update history with new daily word."""
    # Add the date and word to the history
    history[date] = word
    
    with open(history_file, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def pick_daily_word(wordlist, history, date):
    """Pick a random word that hasn't been used recently."""
    # Check if we already have a word for today
    if date in history:
        print(f"Word for {date} already exists: {history[date]}")
        return history[date]
    
    # Get all previously used words
    used_words = set(history.values())
    
    # Filter out used words
    available_words = [word for word in wordlist if word not in used_words]
    
    # If we've used all words (unlikely), reset and use the full list
    if not available_words or len(available_words) < 10:
        print("Warning: Running low on unused words, resetting history")
        available_words = wordlist
    
    # Pick a random word
    daily_word = random.choice(available_words)
    
    return daily_word

def compute_similarities(nlp, daily_word, wordlist, min_similarity=DEFAULT_MIN_SIMILARITY):
    """Compute similarity between daily word and all other words."""
    # Process the daily word
    daily_doc = nlp(daily_word)
    
    # Process all words
    print(f"Computing similarities for {len(wordlist)} words...")
    similarities = []
    
    # Process words in batches for better performance
    docs = list(tqdm(nlp.pipe(wordlist), total=len(wordlist), desc="Processing words"))
    
    for word, doc in tqdm(zip(wordlist, docs), total=len(wordlist), desc="Computing similarities"):
        # Skip the daily word itself
        if word == daily_word:
            continue
        
        if daily_doc.vector.sum() == 0 or doc.vector.sum() == 0:
            continue
        
        # Compute similarity
        similarity = daily_doc.similarity(doc)
        
        # Only keep if similarity is above threshold
        if similarity >= min_similarity:
            similarities.append({
                "word": word,
                "similarity": round(float(similarity) * 100, 2)
            })
    
    # Sort by similarity (descending)
    similarities.sort(key=lambda x: x["similarity"], reverse=True)
    
    return similarities

def normalize_similarities(similarities):
    """Normalize similarities to a 0-100 scale."""
    if not similarities:
        return []
    
    # Find min and max similarity
    min_sim = min(item["similarity"] for item in similarities)
    max_sim = max(item["similarity"] for item in similarities)
    
    # Normalize to 0-100 scale
    for item in similarities:
        normalized = ((item["similarity"] - min_sim) / (max_sim - min_sim)) * 100
        item["score"] = round(normalized, 2)
    
    return similarities
    
def calculate_rank(similarities: dict):
    """Calculate ranks for top 1000 words only"""
    if not similarities:
        return []
    
    top1000 = similarities[:1000]
    for i, item in enumerate(top1000):
        item.update({
            "rank": len(top1000) -1 - i
        })
    
    return top1000 + similarities[1000:]
    
def save_daily_data(output_file, daily_word, similarities, date):
    """Save daily word and similarities to JSON file."""
    data = {
        "date": date,
        "word": daily_word,
        "similarities": similarities
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    parser = argparse.ArgumentParser(description='Generate daily word and similarities for Semantle game')
    
    # Get the absolute path to the project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Default paths using absolute paths
    default_wordlist = os.path.join(project_root, 'public', 'data', 'semantle_wordlist.txt')
    default_output = os.path.join(project_root, 'public', 'data', 'daily.json')
    default_history = os.path.join(project_root, 'public', 'data', 'history.json')
    
    parser.add_argument('--wordlist', '-w', default=default_wordlist,
                        help='Path to filtered wordlist')
    parser.add_argument('--output', '-o', default=default_output,
                        help='Path to save the daily word data')
    parser.add_argument('--history', default=default_history,
                        help='Path to history file')
    parser.add_argument('--date', default=None,
                        help='Date to generate for (YYYY-MM-DD), defaults to today')
    parser.add_argument('--min-similarity', type=float, default=DEFAULT_MIN_SIMILARITY,
                        help='Minimum similarity threshold')
    parser.add_argument('--top-similar', type=int, default=DEFAULT_TOP_SIMILAR,
                        help='Number of top similar words to keep')
    args = parser.parse_args()
    
    # Create directories if they don't exist
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    os.makedirs(os.path.dirname(args.history), exist_ok=True)
    
    # Set random seed based on date for reproducibility
    date = args.date or get_date_string()
    random.seed(date)
    
    # Load spaCy model
    print("Loading spaCy model...")
    nlp = spacy.load('fr_core_news_lg')
    
    # Load wordlist
    print(f"Loading wordlist from {args.wordlist}...")
    wordlist = load_wordlist(args.wordlist)
    print(f"Loaded {len(wordlist)} words")
    
    # Load history
    history = load_history(args.history)
    
    # Check if we already have a word for this date
    if date in history:
        print(f"Word for {date} already exists: {history[date]}")
        daily_word = history[date]
    else:
        # Pick a daily word
        print(f"Picking daily word for {date}...")
        daily_word = pick_daily_word(wordlist, history, date)
        print(f"Daily word: {daily_word}")
        
        # Update history
        update_history(args.history, history, date, daily_word)
    
    # Compute similarities
    similarities = compute_similarities(nlp, daily_word, wordlist, args.min_similarity)
    
    similarities = calculate_rank(similarities)
    
    # Normalize similarities
    # similarities = normalize_similarities(similarities)
    
    # Limit to top N similar words
    if args.top_similar > 0 and len(similarities) > args.top_similar:
        similarities = similarities[:args.top_similar]
    
    # Save daily data
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    save_daily_data(output_path, daily_word, similarities, date)
    print(f"Saved daily word and {len(similarities)} similarities to {output_path}")

if __name__ == '__main__':
    main()
