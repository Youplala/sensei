"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { GameOver } from './GameOver';
import { formatRank, getProgressBarColor, getTemperatureColor, getTemperatureEmoji } from '@/lib/utils';

interface GameProps {
  word: string;
  totalPlayers?: number;
  foundToday?: number;
}

interface GuessData {
  word: string;
  similarity: number;
  rank: number | null;
  id: string;
  isNew?: boolean;
  timestamp?: number;
  isLastGuess?: boolean;
}



export const Game = ({ word, totalPlayers = 1, foundToday = 0 }: GameProps) => {
  const [guess, setGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ solvers: foundToday, totalPlayers, successRate: 0 });
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [guessHistory, setGuessHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use local storage for guesses and game state
  const storageKey = `semantic-word-game-daily-${new Date().toISOString().split('T')[0]}`;
  const [gameState, setGameState] = useState<{
    guesses: GuessData[];
    found: boolean;
  }>({
    guesses: [],
    found: false
  });

  const { guesses, found } = gameState;

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGuess = guess.trim();
    if (!trimmedGuess || isLoading) return;

    // Check if word was already guessed
    if (guesses.some(g => g.word.toLowerCase() === trimmedGuess.toLowerCase())) {
      toast.error(`Vous avez déjà essayé le mot "${trimmedGuess}" !`);
      setGuess('');
      focusInput();
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: trimmedGuess })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Une erreur est survenue');
        setGuess('');
        focusInput();
        return;
      }

      const { similarity, rank, solvers, totalPlayers, successRate } = await response.json();

      const newGuess: GuessData = {
        word: trimmedGuess,
        similarity,
        rank,
        id: Date.now().toString(),
        isNew: true,
        timestamp: Date.now()
      };

      // Add to guess history
      setGuessHistory(prev => [...prev, trimmedGuess]);
      setHistoryIndex(-1);

      setGameState(prev => ({
        ...prev,
        guesses: [newGuess, ...prev.guesses.map(g => ({ ...g, isNew: false }))],
        found: similarity === 100
      }));

      setStats({ solvers, totalPlayers, successRate });

      if (similarity === 100) {
        toast.success('Félicitations ! Vous avez trouvé le mot !');
      }

      setGuess('');
    } catch (error) {
      console.error('Error checking word:', error);
      toast.error('Une erreur est survenue');
      setGuess('');
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  // Get latest guess and sort all guesses by rank
  const latestGuess = guesses[0];
  const sortedGuesses = [...guesses]
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .map(guess => ({
      ...guess,
      isLastGuess: guess.id === latestGuess?.id
    }));

  const focusInput = useCallback(() => {
    if (!found) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [found]);

  // Handle keyboard events for guess history
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex(prev => {
        const newIndex = prev + 1;
        if (newIndex < guessHistory.length) {
          setGuess(guessHistory[guessHistory.length - 1 - newIndex]);
          return newIndex;
        }
        return prev;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex(prev => {
        if (prev > 0) {
          const newIndex = prev - 1;
          setGuess(guessHistory[guessHistory.length - 1 - newIndex]);
          return newIndex;
        } else if (prev === 0) {
          setGuess('');
          return -1;
        }
        return prev;
      });
    } else {
      // Reset history index when typing
      setHistoryIndex(-1);
    }
  }, [guessHistory]);

  // Keep focus when window regains focus
  useEffect(() => {
    window.addEventListener('focus', focusInput);
    return () => window.removeEventListener('focus', focusInput);
  }, [focusInput]);

  // Keep focus when clicking anywhere in the game
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.matches('input, textarea, [contenteditable]')) {
        focusInput();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [focusInput]);

  // Focus input when component is ready
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Handle keyboard events globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !found &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        e.key.length === 1 &&
        e.key.match(/[a-zA-Z]/)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setGuess(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [found]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-4 animate-pulse">
          Sensei 🎯
        </h1>
        <div className="flex justify-center items-center space-x-3 text-sm mb-4">
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg px-4 py-2 shadow-lg border border-purple-200">
            <span className="font-semibold">{isClient ? guesses.length : 0}</span>
            <span className="text-base-content/70"> essais 🎲</span>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg px-4 py-2 shadow-lg border border-indigo-200">
            <span className="font-semibold">{isClient ? stats.solvers : foundToday}</span>
            <span className="text-base-content/70"> ont trouvé 🎉</span>
          </div>
          <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg px-4 py-2 shadow-lg border border-blue-200">
            <span className="font-semibold">
              {isClient ? Math.round(stats.successRate) : 0}%
            </span>
            <span className="text-base-content/70"> taux de réussite ⭐️</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleGuess} className="mb-8">
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value.toLowerCase())}
              onKeyDown={handleKeyDown}
              className="input input-bordered w-full bg-white shadow-sm focus:ring-2 focus:ring-primary pl-10"
              placeholder="Entrez votre mot..."
              disabled={found || isLoading}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className={`w-5 h-5 transition-transform ${historyIndex >= 0 ? 'rotate-180' : ''}`}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
            </div>
            {guessHistory.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {historyIndex >= 0 ? `${historyIndex + 1}/${guessHistory.length}` : '↑ history'}
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className={`btn btn-primary shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ${isLoading ? 'loading' : ''}`}
            disabled={found || isLoading || !guess.trim()}
          >
            {isLoading ? 'Vérification...' : 'Deviner'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {/* Latest guess section */}
        {isClient && latestGuess && (
          <div className="border-b border-gray-200 pb-4">
            <motion.div
              key={latestGuess.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onAnimationComplete={focusInput}
              className="bg-white rounded-lg shadow-sm p-2 transform hover:scale-[1.01] transition-transform ring-2 ring-primary/20"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-primary">
                    {latestGuess.word}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold ${getTemperatureColor(latestGuess.similarity)}`}>
                    {getTemperatureEmoji(latestGuess.similarity)} {latestGuess.similarity}°
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    {formatRank(latestGuess.rank)}
                  </span>
                  <div className="w-24 bg-base-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      layout
                      className={`h-2 rounded-full ${getProgressBarColor(latestGuess.similarity)}`}
                      initial={latestGuess.isNew ? { width: 0 } : { width: `${latestGuess.rank ? (latestGuess.rank / 10) : 0}%` }}
                      animate={{ width: `${latestGuess.rank ? (latestGuess.rank / 10) : 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* All guesses sorted by rank */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {isClient && sortedGuesses.map((guess) => (
              <motion.div
                key={guess.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`bg-white rounded-lg shadow-sm p-2 transform hover:scale-[1.01] transition-transform ${
                  guess.isLastGuess ? 'ring-1 ring-primary/10' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-medium ${
                      guess.isLastGuess ? 'text-primary/80' : ''
                    }`}>
                      {guess.word}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold ${getTemperatureColor(guess.similarity)}`}>
                      {getTemperatureEmoji(guess.similarity)} {guess.similarity}°
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {formatRank(guess.rank)}
                    </span>
                    <div className="w-24 bg-base-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        layout
                        className={`h-2 rounded-full ${getProgressBarColor(guess.similarity)}`}
                        initial={guess.isNew ? { width: 0 } : { width: `${guess.rank ? (guess.rank / 10) : 0}%` }}
                        animate={{ width: `${guess.rank ? (guess.rank / 10) : 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {found && (
          <GameOver
            guesses={guesses}
            foundToday={stats.solvers}
            totalPlayers={stats.totalPlayers}
            onPlayAgain={() => window.location.reload()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
