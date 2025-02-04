import { NextResponse } from 'next/server';
import { GameMemoryCache } from '@/lib/gameCache';
import { ensureGameInitialized } from '@/lib/globalSetup';

export async function POST(request: Request) {
  try {
    await ensureGameInitialized();
    
    const { word } = await request.json();
    
    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Invalid word' },
        { status: 400 }
      );
    }
    
    const cache = GameMemoryCache.getInstance();
    const rawScore = cache.getScore(word);
    
    if (rawScore === null) {
      return NextResponse.json(
        { error: 'Game not initialized' },
        { status: 500 }
      );
    }

    // Convert score to percentage
    const score = Math.round(rawScore * 100);
    const { solvers, totalPlayers } = cache.getStats();

    // If it's the correct word, increment solvers
    if (score === 100) {
      cache.incrementSolvers();
    }

    return NextResponse.json({
      score,
      solvers,
      totalPlayers
    });
  } catch (error) {
    console.error('Error processing score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
