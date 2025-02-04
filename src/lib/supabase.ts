import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { WordTrie } from './wordTrie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface TodaysWordResponse {
  word: string;
  total_players: number;
  found_today: number;
}

export let supabase: ReturnType<typeof createClient<Database>> | null = null;

// Initialize the Supabase client
if (supabaseUrl && supabaseKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseKey);
}

export async function getTodaysWord(): Promise<TodaysWordResponse> {
  if (!supabase) {
    // Development fallback
    return {
      word: 'montée',
      total_players: 100,
      found_today: 10
    };
  }

  try {
    const { data, error } = await supabase
      .rpc('get_todays_word');

    if (error) {
      console.error('RPC error:', error);
      // Development fallback on error
      return {
        word: 'montée',
        total_players: 100,
        found_today: 10
      };
    }

    if (!data) {
      console.error('No data returned from RPC');
      // Development fallback when no data
      return {
        word: 'montée',
        total_players: 100,
        found_today: 10
      };
    }

    return {
      word: data.word || 'montée',
      total_players: data.total_players || 0,
      found_today: data.found_today || 0
    };
  } catch (error) {
    console.error('Error getting today\'s word:', error);
    // Development fallback on error
    return {
      word: 'montée',
      total_players: 100,
      found_today: 10
    };
  }
}

// Cache for valid words using Trie
let validWordsCache: WordTrie | null = null;

export async function getValidWords(): Promise<WordTrie> {
  if (validWordsCache) return validWordsCache;

  if (!supabase) {
    // Mock response for development
    const trie = new WordTrie();
    ['montée', 'ascension', 'escalade'].forEach(w => trie.add(w));
    return trie;
  }

  try {
    const { data, error } = await supabase
      .from('valid_words')
      .select('word');

    if (error) throw error;
    
    validWordsCache = new WordTrie();
    data.forEach(row => validWordsCache!.add(row.word));
    return validWordsCache;
  } catch (error) {
    console.error('Error fetching valid words:', error);
    return new WordTrie(); // Return empty trie on error
  }
}

interface WordResponse {
  word: string;
  temperature: number;
  error?: string;
}

// Add security through rate limiting
const rateLimiter = {
  attempts: new Map<string, number>(),
  lastReset: Date.now(),
  resetInterval: 60000, // 1 minute
  maxAttempts: 30, // 30 attempts per minute

  checkLimit(sessionId: string): boolean {
    const now = Date.now();
    
    // Reset counters if interval passed
    if (now - this.lastReset > this.resetInterval) {
      this.attempts.clear();
      this.lastReset = now;
    }

    const attempts = this.attempts.get(sessionId) || 0;
    if (attempts >= this.maxAttempts) return false;

    this.attempts.set(sessionId, attempts + 1);
    return true;
  }
};

async function recordGuess(word: string, temperature: number, sessionId: string): Promise<void> {
  if (!supabase) return;

  try {
    // Get today's word ID first
    const { data: todayData } = await supabase
      .from('daily_words')
      .select('id')
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (!todayData?.id) return;

    // Record the guess
    await supabase
      .from('user_guesses')
      .insert({
        session_id: sessionId,
        word: word.toLowerCase(),
        daily_word_id: todayData.id,
        temperature,
      });
  } catch (error) {
    console.error('Error recording guess:', error);
  }
}

export async function checkWord(word: string, sessionId: string, validWords: WordTrie): Promise<WordResponse> {
  // Rate limiting check
  if (!rateLimiter.checkLimit(sessionId)) {
    return {
      word,
      temperature: 0,
      error: 'Trop de tentatives. Veuillez attendre une minute.'
    };
  }

  // Development mode or no Supabase client
  if (!supabase) {
    const mockTemp = Math.random() * 100;
    return {
      word,
      temperature: mockTemp
    };
  }

  // Validate word locally first
  if (!validWords.has(word.toLowerCase())) {
    return {
      word,
      temperature: 0,
      error: 'Ce mot n\'existe pas dans notre dictionnaire'
    };
  }

  try {
    // Get today's word
    const { data: todayData, error: todayError } = await supabase
      .from('daily_words')
      .select('word, id')
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (todayError) {
      console.error('Error getting today\'s word:', todayError);
      return {
        word,
        temperature: 0,
        error: 'Erreur lors de la vérification du mot'
      };
    }

    if (!todayData?.word) {
      console.error('No word found for today');
      return {
        word,
        temperature: 0,
        error: 'Erreur: pas de mot du jour'
      };
    }

    // If the word is the same as today's word
    if (word.toLowerCase() === todayData.word.toLowerCase()) {
      const result = {
        word,
        temperature: 100
      };
      
      // Record successful guess
      await supabase
        .from('user_guesses')
        .insert({
          session_id: sessionId,
          word: word.toLowerCase(),
          daily_word_id: todayData.id,
          temperature: 100
        });
        
      return result;
    }

    // Query similarity
    const { data: similarityData, error: similarityError } = await supabase
      .from('word_similarities')
      .select('similarity_score')
      .eq('word1', todayData.word)
      .eq('word2', word.toLowerCase())
      .single();

    if (similarityError && similarityError.code !== 'PGRST116') { // Ignore not found error
      console.error('Error getting similarity:', similarityError);
      return {
        word,
        temperature: 0,
        error: 'Erreur lors de la vérification du mot'
      };
    }

    // If we have a similarity score
    if (similarityData?.similarity_score !== undefined) {
      const temperature = similarityData.similarity_score * 100;
      const result = {
        word,
        temperature
      };

      // Record guess with similarity
      await supabase
        .from('user_guesses')
        .insert({
          session_id: sessionId,
          word: word.toLowerCase(),
          daily_word_id: todayData.id,
          temperature
        });

      return result;
    }

    // Word is valid but no similarity score found
    const result = {
      word,
      temperature: 0
    };

    // Record guess with no similarity
    await supabase
      .from('user_guesses')
      .insert({
        session_id: sessionId,
        word: word.toLowerCase(),
        daily_word_id: todayData.id,
        temperature: 0
      });

    return result;

  } catch (error) {
    console.error('Error checking word:', error);
    return {
      word,
      temperature: 0,
      error: 'Erreur lors de la vérification du mot'
    };
  }
}

export async function getTopWords(): Promise<{ word: string; similarity_score: number }[]> {
  if (!supabase) {
    // Mock response for development
    return Array.from({ length: 100 }, (_, i) => ({
      word: `mot${i + 1}`,
      similarity_score: 100 - (i * 0.5),
    }));
  }

  try {
    const { data, error } = await supabase
      .from('word_similarities')
      .select('word2, similarity_score')
      .order('similarity_score', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map(item => ({
      word: item.word2,
      similarity_score: item.similarity_score,
    }));
  } catch (error) {
    console.error('Error getting top words:', error);
    throw error;
  }
}

export async function getTodaysStats(): Promise<{ total_players: number; found_today: number }> {
  if (!supabase) {
    return {
      total_players: 0,
      found_today: 0
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_words')
      .select(`
        id,
        user_guesses (
          session_id,
          temperature
        )
      `)
      .eq('date', today)
      .single();

    if (error) {
      console.error('Error getting stats:', error);
      return {
        total_players: 0,
        found_today: 0
      };
    }

    if (!data || !data.user_guesses) {
      return {
        total_players: 0,
        found_today: 0
      };
    }

    const uniqueSessions = new Set(data.user_guesses.map((g: any) => g.session_id));
    const foundSessions = new Set(
      data.user_guesses
        .filter((g: any) => g.temperature === 100)
        .map((g: any) => g.session_id)
    );

    return {
      total_players: uniqueSessions.size,
      found_today: foundSessions.size
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      total_players: 0,
      found_today: 0
    };
  }
}

export default supabase;
