import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    console.log('Daily word API route called');
    
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
    
    // Create a hash of the word for verification purposes
    // This allows the client to verify a guess without knowing the actual word
    const wordHash = crypto.createHash('sha256').update(dailyData.word).digest('hex');
    
    console.log('Returning daily word data for date:', dailyData.date);
    
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
