import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { localGameStore } from '@/lib/localGameStore';

interface GameOverProps {
  guesses: Array<{
    word: string;
    similarity: number;
    rank: number;
    id: string;
  }>;
  foundToday: number;
  totalPlayers: number;
  onPlayAgain: () => void;
}

interface TopWord {
  word: string;
  similarity: number;
  rank: number | null;
}

export function GameOver({ guesses, foundToday, totalPlayers, onPlayAgain }: GameOverProps) {
  const [mounted, setMounted] = useState(false);
  const [showTopWords, setShowTopWords] = useState(false);
  const [topWords, setTopWords] = useState<TopWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userWords = new Set(guesses.map(g => g.word.toLowerCase()));

  // Initialize stats after mount to avoid hydration mismatch
  const [stats, setStats] = useState({ 
    attempts: 0,
    avgSim: 0
  });

  useEffect(() => {
    setMounted(true);
    // Calculate stats
    const averageSim = guesses.reduce((acc, curr) => acc + curr.similarity, 0) / guesses.length;
    setStats({
      attempts: guesses.length,
      avgSim: Math.round(averageSim)
    });

    // Fetch top words from API
    const fetchTopWords = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/top-words');
        if (!response.ok) {
          console.error('Failed to fetch top words:', response.status);
          // Fallback to localGameStore if API fails
          const storeTopWords = localGameStore.getTopSimilarities(100);
          setTopWords(storeTopWords);
          return;
        }
        
        const data = await response.json();
        setTopWords(data.slice(0, 100)); // Get top 100 words
      } catch (error) {
        console.error('Error fetching top words:', error);
        // Fallback to localGameStore if API fails
        const storeTopWords = localGameStore.getTopSimilarities(100);
        setTopWords(storeTopWords);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopWords();
  }, [guesses]);

  useEffect(() => {
    if (!mounted) return;
    
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(confettiInterval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
      });
    }, 150);

    return () => clearInterval(confettiInterval);
  }, [mounted]);

  if (!mounted) return null;

  const displayWords = showTopWords ? topWords : guesses.slice().reverse();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto">
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-6 text-primary flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="text-rose-400">Félicitations!</span>
            <span className="text-2xl">🎉</span>
          </h2>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="stat bg-base-100 rounded-lg p-3 border border-base-200">
              <div className="stat-title text-gray-600 text-sm">Essais</div>
              <div className="stat-value text-rose-400 text-2xl">{stats.attempts}</div>
            </div>
            <div className="stat bg-base-100 rounded-lg p-3 border border-base-200">
              <div className="stat-title text-gray-600 text-sm">Moyenne</div>
              <div className="stat-value text-teal-400 text-2xl">{stats.avgSim}%</div>
            </div>
            <div className="stat bg-base-100 rounded-lg p-3 border border-base-200">
              <div className="stat-title text-gray-600 text-sm">Trouvé par</div>
              <div className="stat-value text-emerald-400 text-2xl">{foundToday}/{totalPlayers}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              {showTopWords ? 'Top 100 mots les plus proches' : 'Historique des essais'}
            </h3>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setShowTopWords(!showTopWords)}
              disabled={isLoading}
            >
              {isLoading ? 
                'Chargement...' : 
                (showTopWords ? '↺ Voir historique' : '🏆 Voir top 100')}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-h-80 overflow-y-auto border rounded-lg"
          >
            {isLoading && showTopWords ? (
              <div className="p-4 text-center text-gray-500">Chargement des mots...</div>
            ) : (
              <div className="grid grid-cols-1 divide-y">
                {displayWords.map((item, index) => (
                  <div
                    key={item.word}
                    className={`flex justify-between items-center p-2 ${
                      userWords.has(item.word.toLowerCase()) 
                        ? 'bg-rose-50' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-6 text-gray-500">
                        #{showTopWords ? index + 1 : displayWords.length - index}
                      </span>
                      <span className={`font-medium ${
                        userWords.has(item.word.toLowerCase()) 
                          ? 'text-rose-500' 
                          : 'text-gray-700'
                      }`}>
                        {item.word}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        userWords.has(item.word.toLowerCase())
                          ? 'text-rose-500'
                          : 'text-gray-600'
                      }`}>
                        {item.similarity.toFixed(1)}%
                      </span>
                      {item.rank !== null && item.rank !== undefined && (
                        <span className="text-xs text-gray-400">
                          (#{item.rank})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <div className="mt-6">
            <button
              className="btn btn-outline w-full"
              onClick={onPlayAgain}
            >
              🔄 Jouer à nouveau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
