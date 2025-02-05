"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { WordTrie } from '@/lib/wordTrie';
import { checkWord, getValidWords, getTodaysStats } from '@/lib/supabase';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getCurrentDay } from '@/lib/utils';
import { GameOver } from './GameOver';
import { CreateRoomModal } from './CreateRoomModal';

interface GameProps {
  word: string;
  totalPlayers: number;
  foundToday: number;
  roomCode?: string;
  playerName?: string;
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

export const Game = ({ word, totalPlayers = 0, foundToday = 0, roomCode, playerName }: GameProps) => {
  const [guess, setGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validWords, setValidWords] = useState<WordTrie>(new WordTrie());
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [stats, setStats] = useState({ totalPlayers, foundToday });
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use local storage for guesses and game state
  const storageKey = `semantic-word-game-${getCurrentDay()}${roomCode ? `-${roomCode}` : ''}`;
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
      try {
        const words = await getValidWords();
        setValidWords(words);
      } catch (error) {
        console.error('Error loading valid words:', error);
      }
    }
    loadValidWords();
  }, []);

  // Focus input when component is ready
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Refresh stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { totalPlayers, foundToday } = await getTodaysStats();
        setStats({ totalPlayers: Number(totalPlayers), foundToday: Number(foundToday) });
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
        const { totalPlayers, foundToday } = await getTodaysStats();
        setStats({ totalPlayers: Number(totalPlayers), foundToday: Number(foundToday) });
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
            <span className="font-semibold">{isClient ? stats.foundToday : foundToday}</span>
            <span className="text-base-content/70"> ont trouvé 🎉</span>
          </div>
          <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg px-4 py-2 shadow-lg border border-blue-200">
            <span className="font-semibold">
              {isClient ? Math.round((stats.foundToday / stats.totalPlayers) * 100) : 0}%
            </span>
            <span className="text-base-content/70"> taux de réussite ⭐️</span>
          </div>
        </div>
        {!roomCode && (
          <button
            onClick={() => setShowCreateRoomModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
          >
            Créer une partie privée 🤝
          </button>
        )}
        {roomCode && playerName && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Joueur: {playerName} 👋
          </div>
        )}
      </header>

      <form onSubmit={handleGuess} className="mb-8">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value.toLowerCase())}
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
          {isClient && sortedGuesses.map((guess) => (
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

      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
      />
    </div>
  );
};
