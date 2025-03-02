import { localGameStore } from './localGameStore';
import fs from 'fs';
import path from 'path';

export async function initializeGame() {
  try {
    console.log('Initializing game...');
    
    // Initialize today's word
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Try to read the daily.json file directly from the server
    let dailyWord = null;
    try {
      // This only works on the server side
      const dailyFilePath = path.join(process.cwd(), 'public', 'data', 'daily.json');
      if (fs.existsSync(dailyFilePath)) {
        const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
        dailyWord = dailyData.word;
        console.log('Loaded daily word from file:', dailyWord);
      }
    } catch (error) {
      console.error('Error reading daily.json file:', error);
    }
    
    // If we couldn't read the file directly, use the localGameStore
    if (!dailyWord) {
      dailyWord = localGameStore.getTodaysWord();
      console.log('Using word from localGameStore:', dailyWord);
    }

    if (!dailyWord) {
      console.error('No word found for today');
      return { todaysWord: 'semantic' }; // Fallback word
    }

    console.log('Game initialized successfully with word:', dailyWord);
    
    // Return current game state
    return { 
      todaysWord: dailyWord,
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
