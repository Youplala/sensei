import { localGameStore } from './localGameStore';
import fs from 'fs';
import path from 'path';

export async function initializeGame() {
  try {
    console.log('Initializing game...');
    
    // Try to read the daily.json file directly from the server
    let dailyWord = null;
    if (typeof window === 'undefined') {
      try {
        const dailyFilePath = path.join(process.cwd(), 'public', 'data', 'daily.json');
        if (fs.existsSync(dailyFilePath)) {
          const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
          dailyWord = dailyData.word;
        }
      } catch (error) {
        console.error('Error reading daily.json file:', error);
      }
    }
    
    // Wait for the localGameStore to load the daily data
    await new Promise(resolve => {
      if (localGameStore.isDataLoaded()) {
        resolve(true);
        return;
      }
      
      const checkInterval = setInterval(() => {
        if (localGameStore.isDataLoaded()) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
    });
    
    // For client-side, we don't need the actual word
    const isDataLoaded = localGameStore.isDataLoaded();
    
    if (!isDataLoaded && !dailyWord) {
      console.error('No word data loaded for today');
      return { todaysWord: 'semantic' }; // Fallback word
    }

    console.log('Game initialized successfully');
    
    // Return current game state
    return { 
      todaysWord: dailyWord || 'hidden', // Only server-side will have the actual word
      guessCount: localGameStore.getGuessCount(),
      topSimilarities: localGameStore.getTopSimilarities(10)
    };
  } catch (error) {
    console.error('Error initializing game:', error);
    return { todaysWord: 'semantic' }; // Fallback word
  }
}

export function getGuessCount(): number {
  return localGameStore.getGuessCount();
}
