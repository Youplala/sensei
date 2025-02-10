import { localGameStore } from './localGameStore';

export async function initializeGame() {
  try {
    console.log('Initializing game...');
    
    // Initialize today's word
    const todayDate = new Date().toISOString().split('T')[0];
    const todaysWord = localGameStore.getTodaysWord(todayDate);

    if (!todaysWord) {
      console.error('No word found for today');
      return { todaysWord: 'semantic' }; // Fallback word
    }

    console.log('Game initialized successfully');
    
    // Return current game state
    return { 
      todaysWord,
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
