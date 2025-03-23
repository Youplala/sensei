import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Define the type for similarity items
interface SimilarityItem {
  word: string;
  similarity: number;
  rank?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Verify guess API route called');
    
    // Parse the request body
    const body = await request.json();
    const { guess } = body;
    
    if (!guess) {
      console.warn('Missing guess in request');
      return NextResponse.json(
        { error: 'Guess is required' },
        { status: 400 }
      );
    }
    
    console.log(`Verifying guess: ${guess}`);
    
    // Get the daily word data from Vercel Blob Storage
    // First, list the blobs to find the URL of daily.json
    console.log('Listing blobs from Vercel Blob Storage');
    const { blobs } = await list();
    console.log(`Found ${blobs.length} blobs:`, blobs.map(b => b.pathname));
    
    const dailyBlob = blobs.find(blob => blob.pathname === 'daily.json');
    
    if (!dailyBlob) {
      console.error('Daily blob not found in storage');
      return NextResponse.json(
        { error: 'Daily word data not found' },
        { status: 404 }
      );
    }
    
    console.log('Found daily blob:', dailyBlob.url);
    
    // Fetch the blob content using the URL
    console.log('Fetching blob content');
    const response = await fetch(dailyBlob.url);
    if (!response.ok) {
      console.error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    
    // Read the blob content as JSON
    console.log('Parsing blob content');
    const dailyData = await response.json();
    console.log(`Daily data loaded for date: ${dailyData.date}`);
    
    // Normalize the guess
    const normalizedGuess = guess.toLowerCase().trim();
    
    // Check if the guess is the target word
    if (normalizedGuess === dailyData.word.toLowerCase()) {
      console.log('Correct guess!');
      return NextResponse.json({
        similarity: 100,
        rank: 1000,
        isCorrect: true
      });
    }
    
    // Check if the guess is in the similarities list
    const similarityResult = dailyData.similarities.find(
      (sim: SimilarityItem) => sim.word.toLowerCase() === normalizedGuess
    );
    
    if (similarityResult) {
      console.log(`Found similarity: ${similarityResult.similarity}, rank: ${similarityResult.rank}`);
      return NextResponse.json({
        similarity: similarityResult.similarity,
        rank: similarityResult.rank,
        isCorrect: false
      });
    }
    
    console.log('Guess not found in similarities');
    // If not found, return a default response
    return NextResponse.json({
      similarity: 0,
      rank: null,
      isCorrect: false
    });
  } catch (error) {
    console.error('Error verifying guess:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
