#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Clean wordlist.tsv using spaCy to get words suited for a Semantle game.
This script filters words to keep only meaningful content words (nouns, verbs, adjectives, adverbs)
that would work well in a semantic similarity game.
"""

import spacy
import csv
import argparse
import os
from pathlib import Path
from tqdm import tqdm

def load_wordlist(file_path):
    """Load words from a TSV file with format: freq\tlemme."""
    words = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 2:
                freq, lemma = row[0], row[1]
                words.append((freq, lemma))
    return words

def filter_words(nlp, words, min_length=3, max_length=12):
    """
    Filter words to keep only those suitable for a Semantle game:
    - Keep only nouns, verbs, adjectives, and adverbs
    - Remove stopwords, punctuation, numbers, and proper nouns
    - Ensure words are between min_length and max_length characters
    """
    filtered_words = []
    valid_pos = {'NOUN', 'VERB', 'ADJ', 'ADV'}
    
    print(f"Processing {len(words)} words with spaCy...")
    
    # Process words in batches to improve performance
    lemmas = [word[1] for word in words]
    docs = list(tqdm(nlp.pipe(lemmas), total=len(lemmas), desc="Analyzing words"))
    
    for (freq, lemma), doc in zip(words, docs):
        # Skip if the word is too short or too long
        if not (min_length <= len(lemma) <= max_length):
            continue
            
        # Skip if the word has multiple tokens
        if len(doc) != 1:
            continue
            
        token = doc[0]
        
        # Skip if not a content word we want
        if token.pos_ not in valid_pos:
            continue
            
        # Skip stopwords, punctuation, numbers, and proper nouns
        if token.is_stop or token.is_punct or token.is_digit or token.is_currency or token.is_space:
            continue
            
        # Skip proper nouns (names, places, etc.)
        if token.pos_ == 'PROPN':
            continue
            
        # Skip words with non-alphabetic characters (except hyphens in compound words)
        if not all(c.isalpha() or c == '-' for c in lemma):
            continue
            
        # Add to filtered list with just the lemma (no frequency)
        filtered_words.append(lemma)
    
    return filtered_words

def save_wordlist(words, output_path):
    """Save filtered words to a text file, one word per line."""
    with open(output_path, 'w', encoding='utf-8') as f:
        for word in words:
            f.write(f"{word}\n")

def main():
    parser = argparse.ArgumentParser(description='Clean wordlist for Semantle game')
    
    # Get the absolute path to the project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Default paths using absolute paths
    default_input = os.path.join(project_root, 'public', 'data', 'wordlist.tsv')
    default_output = os.path.join(project_root, 'public', 'data', 'semantle_wordlist.txt')
    
    parser.add_argument('--input', '-i', default=default_input,
                        help='Path to input wordlist TSV file')
    parser.add_argument('--output', '-o', default=default_output,
                        help='Path to save the cleaned wordlist')
    parser.add_argument('--min-length', type=int, default=3,
                        help='Minimum word length to include')
    parser.add_argument('--max-length', type=int, default=12,
                        help='Maximum word length to include')
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    # Load spaCy model
    print("Loading spaCy model...")
    nlp = spacy.load('fr_core_news_lg')
    
    # Load wordlist
    print(f"Loading wordlist from {args.input}...")
    words = load_wordlist(args.input)
    print(f"Loaded {len(words)} words")
    
    # Filter words
    filtered_words = filter_words(nlp, words, args.min_length, args.max_length)
    print(f"Filtered to {len(filtered_words)} words suitable for Semantle")
    
    # Save filtered wordlist
    save_wordlist(filtered_words, args.output)
    print(f"Saved cleaned wordlist to {args.output}")

if __name__ == '__main__':
    main()
