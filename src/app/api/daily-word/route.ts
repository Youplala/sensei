import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Get the daily word data from the file
    const dailyFilePath = path.join(process.cwd(), 'public', 'data', 'daily.json');
    
    if (!fs.existsSync(dailyFilePath)) {
      return NextResponse.json(
        { error: 'Daily word data not found' },
        { status: 404 }
      );
    }
    
    const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
    
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
