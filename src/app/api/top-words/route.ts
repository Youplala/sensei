import { NextResponse } from 'next/server';
import { GameMemoryCache } from '@/lib/gameCache';
import { ensureGameInitialized } from '@/lib/globalSetup';

export async function GET() {
  try {
    await ensureGameInitialized();
    
    const cache = GameMemoryCache.getInstance();
    const similarities = cache.getSimilarities();
    
    if (!similarities) {
      console.error('No similarities found in cache');
      return NextResponse.json(
        { error: 'Game not initialized' },
        { status: 500 }
      );
    }

    console.log(`Found ${similarities.size} similarities in cache`);

    const topWords = Array.from(similarities.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 100)
      .map(([word, score]) => ({
        word,
        similarity_score: score * 100  // Convert to percentage
      }));

    console.log(`Returning ${topWords.length} top words`);
    return NextResponse.json(topWords);
  } catch (error) {
    console.error('Error getting top words:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
