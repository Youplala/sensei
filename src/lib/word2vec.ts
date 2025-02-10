import * as tf from '@tensorflow/tfjs-node';
import { readFileSync } from 'fs';
import path from 'path';

interface Word2VecModel {
  vectors: { [key: string]: number[] };
  dimensions: number;
}

let modelCache: Word2VecModel | null = null;

export async function loadModel(): Promise<Word2VecModel> {
  if (modelCache) return modelCache;

  // Load pre-trained French word2vec model
  const modelPath = path.join(process.cwd(), 'data', 'fr-word2vec.json');
  const modelData = JSON.parse(readFileSync(modelPath, 'utf-8'));
  
  modelCache = {
    vectors: modelData.vectors,
    dimensions: modelData.dimensions
  };
  
  return modelCache;
}

export async function getMostCommonWords(): Promise<string[]> {
  // Load list of common French words
  const wordsPath = path.join(process.cwd(), 'data', 'common-french-words.txt');
  const words = readFileSync(wordsPath, 'utf-8')
    .split('\n')
    .filter(word => word.length > 0);
  
  return words;
}

export async function calculateSimilarity(
  model: Word2VecModel,
  word1: string,
  word2: string
): Promise<number> {
  const vector1 = model.vectors[word1];
  const vector2 = model.vectors[word2];
  
  if (!vector1 || !vector2) return 0;
  
  // Convert to tensors
  const tensor1 = tf.tensor1d(vector1);
  const tensor2 = tf.tensor1d(vector2);
  
  // Calculate cosine similarity
  const dotProduct = tf.sum(tf.mul(tensor1, tensor2));
  const norm1 = tf.sqrt(tf.sum(tf.square(tensor1)));
  const norm2 = tf.sqrt(tf.sum(tf.square(tensor2)));
  
  const similarity = tf.div(dotProduct, tf.mul(norm1, norm2));
  
  // Convert to number and cleanup
  const result = (await similarity.array()) as number;
  tf.dispose([tensor1, tensor2, dotProduct, norm1, norm2, similarity]);
  
  // Convert to percentage and ensure it's between 0 and 100
  return Math.max(0, Math.min(100, result * 100));
}
