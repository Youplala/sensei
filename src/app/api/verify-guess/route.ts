import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { guess } = body;
    
    if (!guess) {
      return NextResponse.json(
        { error: 'Guess is required' },
        { status: 400 }
      );
    }
    
    // Get the daily word data from the file
    const dailyFilePath = path.join(process.cwd(), 'public', 'data', 'daily.json');
    
    if (!fs.existsSync(dailyFilePath)) {
      return NextResponse.json(
        { error: 'Daily word data not found' },
        { status: 404 }
      );
    }
    
    const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
    
    // Normalize the guess
    const normalizedGuess = guess.toLowerCase().trim();
    
    // Check if the guess is the target word
    if (normalizedGuess === dailyData.word.toLowerCase()) {
      return NextResponse.json({
        word: normalizedGuess,
        similarity: 100,
        rank: 1
      });
    }
    
    // Check if the guess is in the similarities list
    const similarityResult = dailyData.similarities.find(
      (sim: any) => sim.word.toLowerCase() === normalizedGuess
    );
    
    if (similarityResult) {
      return NextResponse.json({
        word: normalizedGuess,
        similarity: similarityResult.similarity,
        rank: similarityResult.rank
      });
    }
    
    // If not found, return a default response
    return NextResponse.json({
      word: normalizedGuess,
      similarity: 0,
      rank: null
    });
  } catch (error) {
    console.error('Error verifying guess:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
