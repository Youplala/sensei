interface GameData {
  date: string;
  guessCount: number;
}

interface SimilarityResult {
  word: string;
  similarity: number;
  rank: number | null; // 0-1000 rank, null if not in top 1000
}

// Global singleton instance
let instance: LocalGameStore | null = null;

class LocalGameStore {
  private similarities: Map<string, SimilarityResult>;
  private gameData: GameData | null;
  private validWords: Set<string>;
  private isCorrectGuess: boolean = false;
  private todaysWord: string = '';

  constructor() {
    this.similarities = new Map();
    this.validWords = new Set();
    
    // Initialize with empty game data
    const today = new Date().toISOString().split('T')[0];
    this.gameData = {
      date: today,
      guessCount: 0
    };
  }

  public async verifyGuess(guess: string): Promise<SimilarityResult | null> {
    if (!guess) return null;
    
    // Normalize the guess
    const normalizedGuess = guess.toLowerCase().trim();
    
    // Check if we already have this similarity in our cache
    if (this.similarities.has(normalizedGuess)) {
      return this.similarities.get(normalizedGuess) || null;
    }
    
    // If not in cache, call the API
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: normalizedGuess }),
      });
      
      if (!response.ok) {
        console.warn('Failed to verify guess:', response.status, response.statusText);
        return null;
      }
      
      const result = await response.json();
      
      if (result.similarity !== undefined) {
        // Cache the result
        const similarityResult: SimilarityResult = {
          word: normalizedGuess,
          similarity: result.similarity,
          rank: result.rank
        };
        
        // Update our cache
        this.similarities.set(normalizedGuess, similarityResult);
        
        // Record the guess
        this.recordGuess();
        
        // Update isCorrectGuess if needed
        if (result.rank === 1000) {
          this.isCorrectGuess = true;
          this.todaysWord = normalizedGuess;
        }
        
        return similarityResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error verifying guess:', error);
      return null;
    }
  }

  isValidWord(): boolean {
    // We'll rely on the server to validate words
    return true;
  }

  recordGuess() {
    if (this.gameData) {
      this.gameData.guessCount++;
    }
  }

  getGuessCount(): number {
    return this.gameData?.guessCount || 0;
  }

  getTopSimilarities(count: number): SimilarityResult[] {
    // Sort by similarity (highest first)
    return [...this.similarities.values()]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, count);
  }
  
  getTodaysWord(): string {
    // Only return the word if the user has guessed correctly
    return this.isCorrectGuess ? this.todaysWord : '';
  }
  
  isDataLoaded(): boolean {
    // Since we're not preloading data anymore, we'll consider it always loaded
    return true;
  }
}

// Create a singleton instance
export const localGameStore = (() => {
  if (!instance) {
    instance = new LocalGameStore();
  }
  return instance;
})();
