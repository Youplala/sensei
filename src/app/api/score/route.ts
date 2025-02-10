import { NextRequest, NextResponse } from 'next/server';
import { localGameStore } from '@/lib/localGameStore';

interface RequestBody {
  word: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { word } = body;

    if (!word) {
      return NextResponse.json(
        { message: 'Word is required' },
        { status: 400 }
      );
    }

    // Check if word is valid
    if (!localGameStore.isValidWord(word)) {
      return NextResponse.json(
        { message: `"${word}" n'est pas un mot valide` },
        { status: 400 }
      );
    }

    // Calculate similarity score and rank
    const result = await localGameStore.calculateSimilarity(word);

    // Record the guess
    localGameStore.recordGuess();

    // Get current game stats
    const guessCount = localGameStore.getGuessCount();
    const topSimilarities = localGameStore.getTopSimilarities(10);

    return NextResponse.json({
      similarity: result.similarity,
      rank: result.rank,
      solvers: result.similarity === 100 ? guessCount : 0,
      totalPlayers: 1,
    });
  } catch (error) {
    console.error('Error processing guess:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
