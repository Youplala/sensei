import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTopWords } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { getTemperatureColor } from '@/lib/utils';

interface GameOverProps {
  guesses: Array<{
    word: string;
    temperature: number;
  }>;
  foundToday: number;
  totalPlayers: number;
  onPlayAgain: () => void;
}

interface TopWord {
  word: string;
  similarity_score: number;
}

export function GameOver({ guesses, foundToday, totalPlayers, onPlayAgain }: GameOverProps) {
  const [topWords, setTopWords] = useState<TopWord[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const userWords = new Set(guesses.map(g => g.word.toLowerCase()));
  const sortedGuesses = [...guesses].sort((a, b) => b.temperature - a.temperature);
  const averageTemp = guesses.reduce((acc, curr) => acc + curr.temperature, 0) / guesses.length;

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

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
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      });
    }, 150);

    return () => clearInterval(confettiInterval);
  }, []);

  useEffect(() => {
    const loadTopWords = async () => {
      try {
        const words = await getTopWords();
        setTopWords(words);
      } catch (error) {
        console.error('Error loading top words:', error);
      }
    };
    loadTopWords();
  }, []);

  const stats = {
    attempts: guesses.length,
    maxTemp: Math.max(...guesses.map(g => g.temperature)),
    avgTemp: averageTemp,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-auto p-6"
      >
        <div className="text-center mb-8">
          <motion.h2 
            className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            🎉 Félicitations! 🎉
          </motion.h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title">Essais</div>
              <div className="stat-value text-primary">{stats.attempts}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title">Moyenne</div>
              <div className="stat-value text-secondary">{stats.avgTemp.toFixed(1)}°</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title">Trouvé par</div>
              <div className="stat-value text-accent">{foundToday}/{totalPlayers}</div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              className={`btn ${showLeaderboard ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => setShowLeaderboard(false)}
            >
              📊 Statistiques
            </button>
            <button
              className={`btn ${showLeaderboard ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowLeaderboard(true)}
            >
              🏆 Top 100 closest words
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showLeaderboard ? (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-h-96 overflow-y-auto"
              >
                <div className="grid grid-cols-1 gap-2">
                  {topWords.map((word, index) => (
                    <div
                      key={word.word}
                      className={`flex justify-between items-center p-2 rounded ${
                        userWords.has(word.word.toLowerCase())
                          ? 'bg-primary bg-opacity-10 border border-primary'
                          : 'bg-base-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium w-6">#{index + 1}</span>
                        <span className={`font-medium ${
                          userWords.has(word.word.toLowerCase()) ? 'text-primary' : ''
                        }`}>
                          {word.word}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {(word.similarity_score * 100).toFixed(1)}°
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="guesses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-h-96 overflow-y-auto"
              >
                <div className="space-y-2">
                  {sortedGuesses.map((guess, index) => (
                    <div
                      key={guess.word}
                      className="flex items-center justify-between p-2 bg-base-100 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium w-6">#{guesses.length - index}</span>
                        <span>{guess.word}</span>
                      </div>
                      <span className={getTemperatureColor(guess.temperature)}>
                        {guess.temperature.toFixed(1)}°
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <button
              className="btn btn-outline w-full"
              onClick={onPlayAgain}
            >
              🔄 Jouer à nouveau
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
