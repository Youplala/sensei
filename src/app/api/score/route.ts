import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Define the type for similarity items
interface SimilarityItem {
  word: string;
  similarity: number;
  rank: number | null;
}

// Define the type for daily data
interface DailyData {
  date: string;
  word: string;
  similarities: SimilarityItem[];
}

// Server-side cache for daily data to reduce blob storage requests
let cachedDailyData: DailyData | null = null;
let cachedDate: string | null = null;
let guessCounter: number = 0;
let validWords: Set<string> = new Set();

// Function to load daily data from blob storage
async function loadDailyData(): Promise<DailyData | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Use cache if available and current
    if (cachedDailyData && cachedDate === today) {
      return cachedDailyData;
    }
    
    // Fetch from Vercel Blob Storage
    const { blobs } = await list();
    const dailyBlob = blobs.find(blob => blob.pathname === 'daily.json');
    
    if (!dailyBlob) {
      console.warn('Daily blob not found in storage');
      return null;
    }
    
    const response = await fetch(dailyBlob.url);
    if (!response.ok) {
      console.warn('Failed to fetch daily data from blob storage');
      return null;
    }
    
    const rawData = await response.json();
    
    // Store the data
    const dailyData: DailyData = {
      date: rawData.date,
      word: rawData.word,
      similarities: rawData.similarities
    };
    
    // Update the cache
    cachedDailyData = dailyData;
    cachedDate = today;
    
    // Update valid words set
    validWords = new Set([
      ...(dailyData.similarities || []).map(s => s.word.toLowerCase()),
      dailyData.word.toLowerCase()
    ]);
    
    console.log('Successfully loaded daily data for date:', dailyData.date);
    return dailyData;
  } catch (error) {
    console.error('Error loading daily data:', error);
    return null;
  }
}

// Initialize data at server startup
loadDailyData();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const word = body.word || body.guess; // Support both formats for compatibility
    
    if (!word) {
      return NextResponse.json(
        { message: 'Word is required' },
        { status: 400 }
      );
    }
    
    // Normalize the word
    const normalizedWord = word.toLowerCase().trim();
    
    // Ensure daily data is loaded
    const dailyData = await loadDailyData();
    if (!dailyData) {
      return NextResponse.json(
        { message: 'Daily word data not available' },
        { status: 503 }
      );
    }
    
    // Check if word is valid
    if (!validWords.has(normalizedWord)) {
      return NextResponse.json(
        { message: `"${word}" n'est pas un mot valide` },
        { status: 400 }
      );
    }
    
    // Check if the guess is the target word
    const isCorrect = normalizedWord === dailyData.word.toLowerCase();
    
    let similarity = 0;
    let rank = null;
    
    if (isCorrect) {
      similarity = 100;
      rank = 1000;
    } else {
      // Check if the word is in the similarities list
      const similarityItem = dailyData.similarities.find(
        (sim) => sim.word.toLowerCase() === normalizedWord
      );
      
      if (similarityItem) {
        similarity = similarityItem.similarity;
        rank = similarityItem.rank;
      }
    }
    
    // Increment guess counter
    guessCounter++;
    
    return NextResponse.json({
      similarity: similarity,
      rank: rank,
      solvers: isCorrect ? guessCounter : 0,
      totalPlayers: 1
    });
  } catch (error) {
    console.error('Error processing guess:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
