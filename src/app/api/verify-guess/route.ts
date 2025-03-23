import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Define the type for similarity items
interface SimilarityItem {
  word: string;
  similarity: number;
  rank?: number | null;
}

// Define the type for daily data
interface DailyData {
  date: string;
  word: string;
  similarities: SimilarityItem[];
}

// Cache for daily data to reduce blob storage requests
let cachedDailyData: DailyData | null = null;
let cachedDate: string | null = null;

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
    
    // Normalize the guess
    const normalizedGuess = guess.toLowerCase().trim();
    
    // Check if we need to fetch the daily data or if we can use the cache
    const today = new Date().toISOString().split('T')[0];
    let dailyData;
    
    if (cachedDailyData && cachedDate === today) {
      dailyData = cachedDailyData;
    } else {
      // Get the daily word data from Vercel Blob Storage
      const { blobs } = await list();
      
      const dailyBlob = blobs.find(blob => blob.pathname === 'daily.json');
      
      if (!dailyBlob) {
        return NextResponse.json(
          { error: 'Daily word data not found' },
          { status: 404 }
        );
      }
      
      // Fetch the blob content using the URL
      const response = await fetch(dailyBlob.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      
      // Read the blob content as JSON
      dailyData = await response.json();
      
      // Update the cache
      cachedDailyData = dailyData;
      cachedDate = today;
    }
    
    // Check if the guess is the target word
    if (normalizedGuess === dailyData.word.toLowerCase()) {
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
      return NextResponse.json({
        similarity: similarityResult.similarity,
        rank: similarityResult.rank,
        isCorrect: false
      });
    }
    
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
