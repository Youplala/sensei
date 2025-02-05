import spacy
import numpy as np
from tqdm import tqdm
import json
from pathlib import Path
import argparse

def load_french_words(file_path):
    """Load French words from a text file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]

def compute_similarity_matrix(nlp, words, batch_size=1000):
    """Compute similarity matrix between words using spaCy."""
    # Convert words to spaCy docs
    docs = list(tqdm(nlp.pipe(words), total=len(words), desc="Processing words"))
    
    # Initialize similarity matrix
    n = len(words)
    similarities = {}
    
    # Compute similarities in batches
    for i in tqdm(range(0, n), desc="Computing similarities"):
        for j in range(i + 1, n):
            sim = docs[i].similarity(docs[j])
            if sim > 0.3:  # Only store meaningful similarities
                similarities[f"{words[i]}|{words[j]}"] = float(sim)
    
    return similarities

def normalize_similarities(similarities):
    """Convert similarities to temperature scale (0-100)."""
    sim_values = np.array(list(similarities.values()))
    min_sim, max_sim = sim_values.min(), sim_values.max()
    
    normalized = {}
    for pair, sim in similarities.items():
        # Convert to temperature (0-100 scale)
        temp = ((sim - min_sim) / (max_sim - min_sim)) * 100
        word1, word2 = pair.split('|')
        normalized[pair] = temp
    
    return normalized

def main():
    parser = argparse.ArgumentParser(description='Compute word similarities for the semantic word game.')
    parser.add_argument('input_file', help='Path to the input word list file')
    parser.add_argument('output_file', help='Path to save the computed similarities')
    args = parser.parse_args()
    
    # Load spaCy model
    print("Loading spaCy model...")
    nlp = spacy.load('fr_core_news_lg')
    
    # Load words
    print("Loading word list...")
    words = load_french_words(args.input_file)
    
    # Compute similarities
    print("Computing similarities...")
    similarities = compute_similarity_matrix(nlp, words)
    
    # Normalize to temperature scale
    print("Normalizing similarities...")
    normalized = normalize_similarities(similarities)
    
    # Save results
    print("Saving results...")
    output_path = Path(args.output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)
    
    print(f"Done! Saved {len(normalized)} word pairs to {output_path}")

if __name__ == '__main__':
    main()
