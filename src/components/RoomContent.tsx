"use client";

import { Game } from "./Game";
import { JoinRoomModal } from "./JoinRoomModal";
import { RoomHeader } from "./RoomHeader";

interface RoomContentProps {
  code: string;
  word: string;
  totalPlayers: number;
  foundToday: number;
  name?: string;
}

export function RoomContent({ code, word, totalPlayers, foundToday, name }: RoomContentProps) {
  // If no name is provided, show the join modal
  if (!name) {
    return <JoinRoomModal roomCode={code} />;
  }

  return (
    <main className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile view */}
        <div className="md:hidden">
          <RoomHeader code={code} currentPlayer={name} />
          <Game
            word={word}
            totalPlayers={totalPlayers}
            foundToday={foundToday}
            roomCode={code}
            playerName={name}
          />
        </div>

        {/* Desktop view */}
        <div className="hidden md:grid md:grid-cols-4 gap-6">
          <div className="col-span-3">
            <Game
              word={word}
              totalPlayers={totalPlayers}
              foundToday={foundToday}
              roomCode={code}
              playerName={name}
            />
          </div>
          <div className="col-span-1">
            <div className="sticky top-4">
              <RoomHeader code={code} currentPlayer={name} alwaysShowPlayers />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
