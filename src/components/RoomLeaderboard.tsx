"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  name: string;
  score: number;
  lastGuess?: string;
  guessCount: number;
}

interface RoomLeaderboardProps {
  roomCode: string;
  currentPlayer: string;
}

export function RoomLeaderboard({ roomCode, currentPlayer }: RoomLeaderboardProps) {
  const [isClient, setIsClient] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setIsClient(true);
    // Initialize with current player
    setPlayers([{ name: currentPlayer, score: 0, guessCount: 0 }]);
  }, [currentPlayer]);

  if (!isClient) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 shadow-lg border border-purple-100">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span>Joueurs connectés</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
            0
          </span>
        </h3>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 shadow-lg border border-purple-100">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span>Joueurs connectés</span>
        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
          {players.length}
        </span>
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {players.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center justify-between p-2 rounded ${
                player.name === currentPlayer
                  ? 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10'
                  : 'bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {player.name} {player.name === currentPlayer && '(toi)'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">
                  {player.guessCount} essais
                </span>
                {player.lastGuess && (
                  <span className="text-purple-600 font-medium">
                    {player.lastGuess}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
