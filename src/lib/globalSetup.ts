import { initializeGame } from './initializeGame';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function ensureGameInitialized() {
  if (isInitialized) return;
  
  if (!initializationPromise) {
    initializationPromise = initializeGame().then(() => {
      isInitialized = true;
      console.log('Game initialized successfully');
    }).catch((error) => {
      console.error('Failed to initialize game:', error);
      // Reset so we can try again
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}
