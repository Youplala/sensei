// Script to upload daily word data to Vercel Blob Storage
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

async function uploadToBlob() {
  try {
    // Read the daily.json file
    const dailyFilePath = path.join(process.cwd(), 'public', 'data', 'daily.json');
    
    if (!fs.existsSync(dailyFilePath)) {
      console.error('Daily word data file not found');
      process.exit(1);
    }
    
    const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
    const date = dailyData.date;
    
    // Upload to Vercel Blob Storage
    console.log(`Uploading daily word data for ${date} to Vercel Blob Storage...`);
    
    // Upload the file with a consistent name (daily.json) and a date-specific name
    const dailyContent = Buffer.from(JSON.stringify(dailyData));
    
    // Upload with consistent name (latest)
    const latestBlob = await put('daily.json', dailyContent, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    // Upload with date-specific name for historical access
    const dateBlob = await put(`daily-${date}.json`, dailyContent, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    console.log(`Successfully uploaded daily word data to Vercel Blob Storage`);
    console.log(`Latest URL: ${latestBlob.url}`);
    console.log(`Date-specific URL: ${dateBlob.url}`);
    
    // Optionally, remove the local daily.json file since it's now in Blob Storage
    fs.unlinkSync(dailyFilePath);
    console.log('Removed local daily.json file');
    
  } catch (error) {
    console.error('Error uploading to Vercel Blob Storage:', error);
    process.exit(1);
  }
}

uploadToBlob();
