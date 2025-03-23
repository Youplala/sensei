import { NextResponse } from 'next/server';
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
    
    console.log('Successfully loaded daily data for date:', dailyData.date);
    return dailyData;
  } catch (error) {
    console.error('Error loading daily data:', error);
    return null;
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET() {
  try {
    // Ensure daily data is loaded
    const dailyData = await loadDailyData();
    if (!dailyData) {
      return NextResponse.json(
        { error: 'Daily word data not available' },
        { status: 503 }
      );
    }
    
    // Sort similarities by similarity score (descending)
    const topWords = [...dailyData.similarities]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 1000); // Limit to top 1000
    
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
