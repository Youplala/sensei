import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
    
    return NextResponse.json(dailyData);
  } catch (error) {
    console.error('Error fetching daily word:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
