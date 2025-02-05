"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  name: string;
  guessCount: number;
  lastGuess?: string;
}

interface RoomHeaderProps {
  code: string;
  currentPlayer: string;
  alwaysShowPlayers?: boolean;
}

export function RoomHeader({ code, currentPlayer, alwaysShowPlayers }: RoomHeaderProps) {
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setIsClient(true);
    setPlayers([{ name: currentPlayer, guessCount: 0 }]);
  }, [currentPlayer]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isClient) {
    return null;
  }

  const PlayersList = () => (
    <div className="space-y-1">
      {players.map((player) => (
        <div
          key={player.name}
          className={`flex items-center justify-between p-1.5 rounded ${
            player.name === currentPlayer
              ? 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10'
              : 'bg-white/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">
              {player.name} {player.name === currentPlayer && '(toi)'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">
              {player.guessCount} essais
            </span>
            {player.lastGuess && (
              <span className="text-purple-600 font-medium">
                {player.lastGuess}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`relative ${!alwaysShowPlayers ? 'mb-6' : ''}`}>
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 shadow-sm border border-purple-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-xs text-gray-600">Partie privée avec tes amis</div>
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded text-sm font-medium shrink-0">
              {code}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="text-xs hover:text-purple-600 transition-colors whitespace-nowrap"
            >
              {copied ? '✨ Copié!' : '🔗 Inviter'}
            </button>
            {!alwaysShowPlayers && (
              <>
                <div className="w-px h-4 bg-purple-200" />
                <button
                  onClick={() => setShowPlayers(!showPlayers)}
                  className="text-xs flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                >
                  <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {players.length}
                  </span>
                  <span className="hidden sm:inline">{showPlayers ? 'Masquer' : 'Voir'}</span>
                  <span>{showPlayers ? '↑' : '↓'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Always show players for desktop view */}
        {alwaysShowPlayers && (
          <div className="pt-2 mt-2 border-t border-purple-100">
            <PlayersList />
          </div>
        )}

        {/* Collapsible players list for mobile view */}
        {!alwaysShowPlayers && (
          <AnimatePresence>
            {showPlayers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 mt-2 border-t border-purple-100">
                  <PlayersList />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
