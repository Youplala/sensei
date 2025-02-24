const SAMPLE_SIMILARITIES: Record<string, { similarity: number; rank: number }> = {
  'semantic': { similarity: 100, rank: 1000 },
  'meaning': { similarity: 85, rank: 998 },
  'word': { similarity: 65, rank: 980 },
  'definition': { similarity: 30, rank: 700 },
  'sentence': { similarity: 40, rank: 300 },
  'grammar': { similarity: 55, rank: 550 },
  'vocabulary': { similarity: 65, rank: 650 },
  'thesaurus': { similarity: 70, rank: 700 },
  'lexicon': { similarity: 75, rank: 750 },
  'syntax': { similarity: 45, rank: 450 },
  'language': { similarity: 60, rank: 600 },
  'dictionary': { similarity: 50, rank: 500 },
  'phrase': { similarity: 45, rank: 400 },
  'speech': { similarity: 35, rank: 200 },
  'expression': { similarity: 50, rank: 100 },
  // Add more words here...
};

export default SAMPLE_SIMILARITIES;
