import { createClient } from '@supabase/supabase-js';
import { loadModel, getMostCommonWords, calculateSimilarity } from '../src/lib/word2vec.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function selectNewWord() {
  // Load the pre-trained word2vec model
  const model = await loadModel();
  
  // Get list of common French words
  const commonWords = await getMostCommonWords();
  
  // Filter out previously used words
  const { data: usedWords } = await supabase
    .from('daily_words')
    .select('word')
    .order('created_at', { ascending: false });
  
  const usedWordsSet = new Set(usedWords.map(w => w.word));
  const availableWords = commonWords.filter(w => !usedWordsSet.has(w));
  
  // Randomly select a word from available words
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const selectedWord = availableWords[randomIndex];
  
  // Pre-calculate similarities for common words
  const similarities = {};
  for (const word of commonWords) {
    const similarity = await calculateSimilarity(model, selectedWord, word);
    if (similarity > 0.3) { // Only store meaningful similarities
      similarities[word] = similarity;
    }
  }
  
  // Store the new word and its similarities
  const { error } = await supabase
    .from('daily_words')
    .insert([
      {
        word: selectedWord,
        similarities: similarities,
        created_at: new Date().toISOString()
      }
    ]);
  
  if (error) {
    console.error('Error storing new word:', error);
    process.exit(1);
  }
  
  console.log(`Successfully updated daily word to: ${selectedWord}`);
}

selectNewWord().catch(console.error);
