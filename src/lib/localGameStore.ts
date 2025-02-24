import { WordTrie } from './wordTrie';

// Sample similarities with proximity ranks (0-1000)
const SAMPLE_SIMILARITIES: Record<string, { similarity: number; rank: number }> = {
  'meaning': { similarity: 85, rank: 998 },
  'word': { similarity: 65, rank: 980 },
  'language': { similarity: 75, rank: 975 },
  'dictionary': { similarity: 70, rank: 950 },
  'syntax': { similarity: 60, rank: 900 },
  'grammar': { similarity: 55, rank: 850 },
  'vocabulary': { similarity: 65, rank: 800 },
  'definition': { similarity: 30, rank: 700 },
  'thesaurus': { similarity: 70, rank: 600 },
  'lexicon': { similarity: 75, rank: 500 },
  'phrase': { similarity: 45, rank: 400 },
  'sentence': { similarity: 40, rank: 300 },
  'speech': { similarity: 35, rank: 200 },
  'expression': { similarity: 50, rank: 100 },
  'semantic': { similarity: 100, rank: 1000 }

};

interface GameData {
  word: string;
  date: string;
  guessCount: number;
}

interface SimilarityResult {
  similarity: number;  // 0-100 percentage
  rank: number | null; // 0-1000 rank, null if not in top 1000
}

class LocalGameStore {
  private wordTrie: WordTrie;
  private similarities: Map<string, { similarity: number; rank: number }>;
  private gameData: GameData | null;
  private validWords: Set<string>;

  constructor() {
    // Initialize with sample data immediately
    this.wordTrie = new WordTrie();
    this.similarities = new Map(
      Object.entries(SAMPLE_SIMILARITIES).map(([word, data]) => [word.toLowerCase(), data])
    );
    
    // Initialize game data with today's word
    const today = new Date().toISOString().split('T')[0];
    this.gameData = {
      word: 'semantic',
      date: today,
      guessCount: 0
    };
    
    this.validWords = new Set(Object.keys(SAMPLE_SIMILARITIES));

    // Initialize word trie with sample words
    this.validWords.forEach(word => {
      this.wordTrie.add(word.toLowerCase());
    });

    console.log('LocalGameStore initialized with sample data');
  }

  getTodaysWord(date: string): string {
    // For development, always return 'semantic'
    const word = 'semantic';
    
    this.gameData = {
      word,
      date,
      guessCount: 0
    };
    
    return word;
  }

  setSimilarity(word: string, data: { similarity: number; rank: number }) {
    this.similarities.set(word.toLowerCase(), data);
  }

  async calculateSimilarity(guess: string): Promise<SimilarityResult> {
    if (!this.gameData) return { similarity: 0, rank: null };
    
    const normalizedGuess = guess.toLowerCase();
    if (normalizedGuess === this.gameData.word) {
      return { similarity: 100, rank: 1000 }; // Perfect match is rank 1000
    }
    
    const result = this.similarities.get(normalizedGuess);
    return result 
      ? { similarity: result.similarity, rank: result.rank }
      : { similarity: 0, rank: null };
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

  getTopSimilarities(limit: number): Array<{ word: string; similarity: number; rank: number }> {
    return Array.from(this.similarities.entries())
      .sort(([, a], [, b]) => b.rank - a.rank)
      .slice(0, limit)
      .map(([word, data]) => ({
        word,
        similarity: data.similarity,
        rank: data.rank
      }));
  }
}

// Create a singleton instance
export const localGameStore = new LocalGameStore();
