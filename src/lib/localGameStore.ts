import { WordTrie } from './wordTrie';

interface GameData {
  word: string;
  date: string;
  guessCount: number;
}

interface SimilarityResult {
  word: string;
  similarity: number;
  rank: number | null; // 0-1000 rank, null if not in top 1000
}

interface DailyData {
  date: string;
  word: string;
  similarities: Array<SimilarityResult>;
}

class LocalGameStore {
  private wordTrie: WordTrie;
  private similarities: Map<string, SimilarityResult>;
  private gameData: GameData | null;
  private validWords: Set<string>;
  private dailyData: DailyData | null = null;

  constructor() {
    this.wordTrie = new WordTrie();
    this.similarities = new Map();
    this.validWords = new Set();
    
    // Initialize with empty game data
    const today = new Date().toISOString().split('T')[0];
    this.gameData = {
      word: '',
      date: today,
      guessCount: 0
    };
    
    // Load daily data
    this.loadDailyData();
    
    console.log('LocalGameStore initialized');
  }

  private async loadDailyData() {
    try {
      console.log('Attempting to load daily data...');
      
      // Check if we're in a browser or server environment
      if (typeof window !== 'undefined') {
        // Client-side: Use relative URL for API call
        const response = await fetch('/api/daily-word', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.warn('Daily data not available:', response.status, response.statusText);
          return;
        }
        
        this.dailyData = await response.json();
      } else {
        // Server-side: Read file directly from filesystem
        try {
          const fs = require('fs');
          const path = require('path');
          const dailyFilePath = path.join(process.cwd(), 'public', 'data', 'daily.json');
          
          if (fs.existsSync(dailyFilePath)) {
            this.dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
          } else {
            console.log('Daily data file not found');
            return;
          }
        } catch (fsError) {
          console.error('Error reading daily data file:', fsError);
          return;
        }
      }
      
      if (!this.dailyData) {
        console.warn('Failed to load daily data');
        return;
      }
      
      console.log('Successfully loaded daily data:', this.dailyData.word);
      
      // Update game data with the daily word
      this.gameData = {
        word: this.dailyData.word,
        date: this.dailyData.date,
        guessCount: 0
      };
      
      // Update similarities map and valid words
      this.similarities.clear();
      this.validWords.clear();
      
      // Add the daily word itself
      this.validWords.add(this.dailyData.word.toLowerCase());
      this.wordTrie.add(this.dailyData.word.toLowerCase());
      
      // Add the target word with perfect similarity
      this.similarities.set(this.dailyData.word.toLowerCase(), {
        word: this.dailyData.word.toLowerCase(),
        similarity: 100,
        rank: 1000
      });
      
      // Add all similar words
      this.dailyData.similarities.forEach((item) => {
        const normalizedWord = item.word.toLowerCase();
        this.validWords.add(normalizedWord);
        this.wordTrie.add(normalizedWord);
        this.similarities.set(normalizedWord, {
          word: normalizedWord,
          similarity: item.similarity, // No need to multiply by 100
          rank: item.rank // Rank is already provided directly
        });
      });
      
      console.log(`Updated with ${this.validWords.size} valid words`);
    } catch (error) {
      console.error('Error loading daily data:', error);
    }
  }

  getTodaysWord(): string {
    if (!this.gameData || !this.gameData.word) {
      return '';
    }
    return this.gameData.word;
  }

  async calculateSimilarity(guess: string): Promise<SimilarityResult | null> {
    if (!this.gameData || !this.gameData.word) {
      return null;
    }
    
    const normalizedGuess = guess.toLowerCase();
    
    // Check if the word exists in our similarities map
    const result = this.similarities.get(normalizedGuess);
    
    if (!result) {
      return null;
    }
    
    return result;
  }

  isValidWord(word: string): boolean {
    return this.validWords.has(word.toLowerCase());
  }

  recordGuess() {
    if (this.gameData) {
      this.gameData.guessCount++;
    }
  }

  getGuessCount(): number {
    return this.gameData?.guessCount || 0;
  }

  getTopSimilarities(limit: number): Array<SimilarityResult> {
    return Array.from(this.similarities.entries())
      .sort(([, a], [, b]) => (b.rank || 0) - (a.rank || 0))
      .slice(0, limit)
      .map(([, data]) => data);
  }
}

// Create a singleton instance
export const localGameStore = new LocalGameStore();
