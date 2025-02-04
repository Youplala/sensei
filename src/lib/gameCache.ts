interface GameData {
  word: string;
  date: string;
  similarities: Map<string, number>;
  solvers: number;
  totalPlayers: number;
}

export class GameMemoryCache {
  private static instance: GameMemoryCache;
  private cache: GameData | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  private constructor() {}

  public static getInstance(): GameMemoryCache {
    if (!GameMemoryCache.instance) {
      GameMemoryCache.instance = new GameMemoryCache();
    }
    return GameMemoryCache.instance;
  }

  public async initialize(word: string, similarities: Map<string, number>, date: string): Promise<void> {
    this.cache = {
      word,
      date,
      similarities,
      solvers: 0,
      totalPlayers: 0
    };
    this.lastUpdate = Date.now();
  }

  public getScore(word: string): number | null {
    if (!this.cache || this.isExpired()) return null;
    return this.cache.similarities.get(word.toLowerCase()) || 0;
  }

  public incrementSolvers(): void {
    if (this.cache) {
      this.cache.solvers++;
    }
  }

  public incrementPlayers(): void {
    if (this.cache) {
      this.cache.totalPlayers++;
    }
  }

  public getStats(): { solvers: number; totalPlayers: number } {
    return {
      solvers: this.cache?.solvers || 0,
      totalPlayers: this.cache?.totalPlayers || 0
    };
  }

  public getCurrentWord(): string | null {
    if (!this.cache || this.isExpired()) return null;
    return this.cache.word;
  }

  public getSimilarities(): Map<string, number> | null {
    if (!this.cache || this.isExpired()) return null;
    return this.cache.similarities;
  }

  private isExpired(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_TTL;
  }

  public clear(): void {
    this.cache = null;
  }
}
