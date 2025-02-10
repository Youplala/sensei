import { NextResponse } from 'next/server';
import { localGameStore } from '@/lib/localGameStore';

export async function GET() {
  try {
    
    const topWords = localGameStore.getTopSimilarities(100);
    
    if (!topWords || topWords.length === 0) {
      console.error('No similarities found in store');
      return NextResponse.json(
        { error: 'Game not initialized' },
        { status: 500 }
      );
    }

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
