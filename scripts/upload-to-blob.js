// Script to upload daily word data to Vercel Blob Storage
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

async function uploadToBlob() {
  try {
    // Check if the BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
      console.error('Please set this environment variable with a valid Vercel Blob Storage token');
      console.error('You can get a token from the Vercel dashboard: https://vercel.com/dashboard/stores/blob');
      process.exit(1);
    }

    // Read the daily.json file
    const dailyFilePath = path.join(process.cwd(), 'public', 'data', 'daily.json');
    
    if (!fs.existsSync(dailyFilePath)) {
      console.error(`Error: Daily word data file not found at ${dailyFilePath}`);
      process.exit(1);
    }
    
    const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
    const date = dailyData.date;
    
    // Upload to Vercel Blob Storage
    console.log(`Uploading daily word data for ${date} to Vercel Blob Storage...`);
    
    // Upload the file with a consistent name (daily.json) and a date-specific name
    const dailyContent = Buffer.from(JSON.stringify(dailyData));
    
    try {
      // Upload with consistent name (latest)
      console.log('Uploading with consistent name (daily.json)...');
      const latestBlob = await put('daily.json', dailyContent, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      console.log(`Successfully uploaded daily.json to: ${latestBlob.url}`);
      
      // Upload with date-specific name for historical access
      console.log(`Uploading with date-specific name (daily-${date}.json)...`);
      const dateBlob = await put(`daily-${date}.json`, dailyContent, {
        access: 'public',
        addRandomSuffix: false,
      });
      
      console.log(`Successfully uploaded daily-${date}.json to: ${dateBlob.url}`);
      
      console.log('Successfully uploaded daily word data to Vercel Blob Storage');
      console.log(`Latest URL: ${latestBlob.url}`);
      console.log(`Date-specific URL: ${dateBlob.url}`);
      
      // Optionally, remove the local daily.json file since it's now in Blob Storage
      fs.unlinkSync(dailyFilePath);
      console.log('Removed local daily.json file');
    } catch (uploadError) {
      console.error('Error during upload to Vercel Blob Storage:');
      console.error(uploadError);
      
      if (uploadError.message && uploadError.message.includes('Access denied')) {
        console.error('\nThis error typically means your BLOB_READ_WRITE_TOKEN is invalid or expired.');
        console.error('Please check your token in the Vercel dashboard: https://vercel.com/dashboard/stores/blob');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error uploading to Vercel Blob Storage:');
    console.error(error);
    process.exit(1);
  }
}

uploadToBlob();
