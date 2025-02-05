"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JoinRoomModalProps {
  roomCode: string;
}

export function JoinRoomModal({ roomCode }: JoinRoomModalProps) {
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    setIsLoading(true);
    // Redirect to the same URL but with the name parameter
    router.push(`/room/${roomCode}?name=${encodeURIComponent(firstName.trim())}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          Rejoindre la partie
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-2">
              Ton prénom
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Entre ton prénom"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !firstName.trim()}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Chargement...' : 'Rejoindre 🎮'}
          </button>
        </form>
      </div>
    </div>
  );
}
