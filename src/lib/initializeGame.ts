import { supabase } from './supabase';
import { GameMemoryCache } from './gameCache';

export async function initializeGame() {
  const cache = GameMemoryCache.getInstance();
  const today = new Date().toISOString().split('T')[0];

  // If cache is already initialized with today's data, skip
  if (cache.getCurrentWord()) return;

  if (!supabase) return;

  try {
    console.log('Initializing game cache...');
    
    // Get today's word
    const { data: todayData } = await supabase
      .from('daily_words')
      .select('word')
      .eq('date', today)
      .single();

    if (!todayData?.word) {
      console.error('No word found for today');
      return;
    }

    console.log('Found today\'s word, fetching similarities...');

    // Get all similarities for today's word
    const { data: similarities } = await supabase
      .from('word_similarities')
      .select('word2, similarity_score')
      .eq('word1', todayData.word);

    if (!similarities) {
      console.error('No similarities found');
      return;
    }

    console.log(`Found ${similarities.length} similar words`);

    // Convert to Map for O(1) lookup
    const similarityMap = new Map<string, number>();
    similarities.forEach(({ word2, similarity_score }) => {
      similarityMap.set(word2.toLowerCase(), similarity_score);
    });

    // Add the word itself with 100% similarity
    similarityMap.set(todayData.word.toLowerCase(), 1);

    console.log('Initializing cache with similarities...');

    // Initialize cache
    await cache.initialize(todayData.word, similarityMap, today);

    // Get current stats
    const { data: stats } = await supabase
      .from('user_guesses')
      .select('session_id, temperature')
      .eq('daily_word_id', todayData.word);

    if (stats) {
      const uniquePlayers = new Set(stats.map(s => s.session_id)).size;
      const solvers = stats.filter(s => s.temperature === 100).length;
      
      for (let i = 0; i < uniquePlayers; i++) {
        cache.incrementPlayers();
      }
      for (let i = 0; i < solvers; i++) {
        cache.incrementSolvers();
      }
    }

    console.log('Game cache initialized successfully');
  } catch (error) {
    console.error('Error initializing game:', error);
  }
}
