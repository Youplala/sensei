import { WordTrie } from './wordTrie';
import { list } from '@vercel/blob';

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

// Cache for daily data to avoid repeated blob fetches
let cachedDailyData: DailyData | null = null;
let cachedDate: string | null = null;

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
        
        const apiResponse = await response.json();
        
        // Server now only returns date and wordHash, not the actual word or similarities
        if (apiResponse.date) {
          // Store the API response data
          this.dailyData = {
            date: apiResponse.date,
            word: '', // Word is not available from API
            similarities: [] // Similarities are not available from API
          };
          
          // Update game data with the date
          this.gameData = {
            word: '', // Word is not available from API
            date: apiResponse.date,
            guessCount: 0
          };
        }
      } else {
        // Server-side: Fetch from Vercel Blob Storage
        try {
          // Check if we already have cached data for today
          const today = new Date().toISOString().split('T')[0];
          
          if (cachedDailyData && cachedDate === today) {
            console.log('Using cached daily data');
            this.dailyData = cachedDailyData;
          } else {
            // Fetch from Vercel Blob Storage
            const { blobs } = await list();
            const dailyBlob = blobs.find(blob => blob.pathname === 'daily.json');
            
            if (!dailyBlob) {
              console.warn('Daily blob not found in storage');
              return;
            }
            
            const response = await fetch(dailyBlob.url);
            if (!response.ok) {
              console.warn('Failed to fetch daily data from blob storage');
              return;
            }
            
            this.dailyData = await response.json();
            
            // Cache the data for future use
            if (this.dailyData && this.dailyData.date) {
              cachedDailyData = this.dailyData;
              cachedDate = this.dailyData.date;
            }
          }
          
          // On server-side, we have access to the full data
          // Update game data with the daily word
          if (this.dailyData) {
            this.gameData = {
              word: this.dailyData.word,
              date: this.dailyData.date,
              guessCount: 0
            };
            
            // Update similarities map
            if (this.dailyData.similarities) {
              this.similarities.clear();
              for (const sim of this.dailyData.similarities) {
                this.similarities.set(sim.word, sim);
              }
            }
            
            // Update valid words set
            this.validWords = new Set([
              ...(this.dailyData.similarities || []).map(s => s.word),
              this.dailyData.word
            ]);
          }
        } catch (error) {
          console.error('Error fetching daily data from blob storage:', error);
          return;
        }
      }
      
      if (!this.dailyData) {
        console.warn('Failed to load daily data');
        return;
      }
      
      console.log('Successfully loaded daily data for date:', this.dailyData.date);
    } catch (error) {
      console.error('Error loading daily data:', error);
    }
  }

  public async calculateSimilarity(guess: string): Promise<SimilarityResult | null> {
    if (!guess) return null;
    
    // Normalize the guess
    guess = guess.toLowerCase().trim();
    
    // Check if we already have this similarity in our cache
    if (this.similarities.has(guess)) {
      return this.similarities.get(guess) || null;
    }
    
    // If we're on the client side, we need to make an API call to verify the guess
    if (typeof window !== 'undefined') {
      try {
        // Make an API call to verify the guess
        const response = await fetch('/api/verify-guess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ guess }),
        });
        
        if (!response.ok) {
          console.warn('Failed to verify guess:', response.status, response.statusText);
          return null;
        }
        
        const result = await response.json();
        
        if (result.similarity !== undefined) {
          // Cache the result
          const similarityResult: SimilarityResult = {
            word: guess, // Use the guess as the word since API no longer returns it
            similarity: result.similarity,
            rank: result.rank
          };
          
          this.similarities.set(guess, similarityResult);
          return similarityResult;
        }
        
        return null;
      } catch (error) {
        console.error('Error verifying guess:', error);
        return null;
      }
    } else {
      // Server-side: we have direct access to the word and similarities
      if (this.dailyData?.word === guess) {
        return {
          word: guess,
          similarity: 100,
          rank: 1000
        };
      }
      
      // Check if we have this word in our similarities
      const similarities = this.dailyData?.similarities || [];
      for (const sim of similarities) {
        if (sim.word === guess) {
          return sim;
        }
      }
      
      return null;
    }
  }

  getTodaysWord(): string {
    if (!this.gameData || !this.gameData.word) {
      return '';
    }
    return this.gameData.word;
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
