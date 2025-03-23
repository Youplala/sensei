import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    // Get the daily word data from Vercel Blob Storage
    // First, list the blobs to find the URL of daily.json
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
    const dailyData = await response.json();
    
    // Create a hash of the word for verification purposes
    // This allows the client to verify a guess without knowing the actual word
    const wordHash = crypto.createHash('sha256').update(dailyData.word).digest('hex');
    
    // Return only the date and word hash, not the actual word or similarities
    return NextResponse.json({
      date: dailyData.date,
      wordHash: wordHash,
      // Don't include the actual word or similarities
    });
  } catch (error) {
    console.error('Error fetching daily word:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
