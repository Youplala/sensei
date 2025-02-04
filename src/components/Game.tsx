"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { WordTrie } from '@/lib/wordTrie';
import { checkWord, getValidWords, getTodaysStats } from '@/lib/supabase';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getCurrentDay } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GameOver } from './GameOver';

interface GameProps {
  word: string;
  totalPlayers: number;
  foundToday: number;
}

interface GuessData {
  word: string;
  temperature: number;
  id: string;
  isNew?: boolean;
}

const getTemperatureColor = (temp: number) => {
  if (temp >= 75) return 'text-temp-hot';
  if (temp >= 50) return 'text-temp-warm';
  if (temp >= 25) return 'text-temp-mild';
  return 'text-temp-cold';
};

const getTemperatureEmoji = (temp: number) => {
  if (temp >= 75) return '🔥';
  if (temp >= 50) return '🌡️';
  if (temp >= 25) return '❄️';
  return '🧊';
};

const getProgressBarColor = (temp: number) => {
  if (temp >= 75) return 'bg-temp-hot';
  if (temp >= 50) return 'bg-temp-warm';
  if (temp >= 25) return 'bg-temp-mild';
  return 'bg-temp-cold';
};

export const Game = ({ word, totalPlayers = 0, foundToday = 0 }: GameProps) => {
  const [guess, setGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [validWords, setValidWords] = useState<WordTrie>(new WordTrie());
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [stats, setStats] = useState({ totalPlayers, foundToday });
  const inputRef = useRef<HTMLInputElement>(null);

  // Use local storage for guesses and game state
  const storageKey = `semantic-word-game-${getCurrentDay()}`;
  const [gameState, setGameState] = useLocalStorage<{
    guesses: GuessData[];
    found: boolean;
  }>(storageKey, {
    guesses: [],
    found: false,
  });

  const { guesses, found } = gameState;

  // Sort guesses by temperature
  const sortedGuesses = [...guesses].sort((a, b) => b.temperature - a.temperature);

  const focusInput = useCallback(() => {
    if (!found) {
      // Force focus with a small delay to ensure it works after animations
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [found]);

  // Keep focus when window regains focus
  useEffect(() => {
    const handleFocus = () => focusInput();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [focusInput]);

  // Keep focus when clicking anywhere in the game
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't steal focus from other input elements
      if (!target.matches('input, textarea, [contenteditable]')) {
        focusInput();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [focusInput]);

  // Load valid words on mount
  useEffect(() => {
    async function loadValidWords() {
      const words = await getValidWords();
      setValidWords(words);
    }
    loadValidWords();
    setMounted(true);
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (mounted) {
      focusInput();
    }
  }, [mounted, focusInput]);

  // Refresh stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { total_players, found_today } = await getTodaysStats();
        setStats({ totalPlayers: Number(total_players), foundToday: Number(found_today) });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    // Initial fetch
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle keyboard events globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If any text input or textarea is not focused and a letter key is pressed
      if (
        !found &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        e.key.length === 1 &&
        e.key.match(/[a-zA-Z]/)
      ) {
        e.preventDefault(); // Prevent the key from being typed before focus
        inputRef.current?.focus();
        // Re-add the key that was pressed
        setGuess(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [found]);

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGuess = guess.trim();
    if (!trimmedGuess || isLoading) return;

    // Check if word was already guessed
    if (guesses.some(g => g.word.toLowerCase() === trimmedGuess.toLowerCase())) {
      toast.error('Vous avez déjà essayé ce mot !');
      setGuess('');
      focusInput();
      return;
    }

    try {
      setIsLoading(true);
      const response = await checkWord(trimmedGuess, sessionId, validWords);

      // Handle invalid words or rate limiting
      if (response.error) {
        toast.error(response.error);
        setGuess('');
        focusInput();
        return;
      }

      const newGuess: GuessData = {
        word: response.word,
        temperature: response.temperature,
        id: Date.now().toString(),
        isNew: true
      };

      setGameState(prev => ({
        ...prev,
        guesses: [newGuess, ...prev.guesses.map(g => ({ ...g, isNew: false }))],
      }));

      if (word && trimmedGuess.toLowerCase() === word.toLowerCase()) {
        setGameState(prev => ({ ...prev, found: true }));
        toast.success('Félicitations! Vous avez trouvé le mot!');
        const { total_players, found_today } = await getTodaysStats();
        setStats({ totalPlayers: Number(total_players), foundToday: Number(found_today) });
      }

      setGuess('');
      focusInput();
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
      console.error('Error checking word:', error);
      setGuess('');
      focusInput();
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null; // Prevent hydration issues
  }

  return (
    <div 
      className="container mx-auto px-4 py-8 max-w-4xl"
      // Ensure clicks anywhere in the container focus the input
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea, [contenteditable], button')) {
          focusInput();
        }
      }}
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Sensei
        </h1>
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Essais</div>
              <div className="stat-value text-primary">{guesses.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Trouvé aujourd'hui</div>
              <div className="stat-value text-secondary">{stats.foundToday}</div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Prochain mot dans {formatDistanceToNow(new Date().setHours(24, 0, 0, 0), { locale: fr })}
        </p>
      </motion.div>

      <form onSubmit={handleGuess} className="mb-8">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="input input-bordered flex-1 bg-white shadow-sm focus:ring-2 focus:ring-primary"
            placeholder="Entrez votre mot..."
            disabled={found || isLoading}
            autoComplete="off"
          />
          <button 
            type="submit" 
            className={`btn btn-primary shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ${isLoading ? 'loading' : ''}`}
            disabled={found || isLoading || !guess.trim()}
          >
            {isLoading ? 'Vérification...' : 'Deviner'}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedGuesses.map((guess) => (
            <motion.div
              key={guess.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onAnimationComplete={focusInput}
              className="bg-white rounded-lg shadow-sm p-2 transform hover:scale-[1.01] transition-transform"
            >
              <div className="flex justify-between items-center">
                <span className="text-base font-medium">{guess.word}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${getTemperatureColor(guess.temperature)}`}>
                    {getTemperatureEmoji(guess.temperature)} {guess.temperature.toFixed(1)}°
                  </span>
                  <div className="w-24 bg-base-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      layout
                      className={`h-2 rounded-full ${getProgressBarColor(guess.temperature)}`}
                      initial={guess.isNew ? { width: 0 } : { width: `${guess.temperature}%` }}
                      animate={{ width: `${guess.temperature}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {found && (
          <GameOver
            guesses={guesses}
            foundToday={stats.foundToday}
            totalPlayers={stats.totalPlayers}
            onPlayAgain={() => window.location.reload()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
