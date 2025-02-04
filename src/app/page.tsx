import { Game } from "@/components/Game";
import { getTodaysWord } from "@/lib/supabase";

export default async function Home() {
  const { word, totalPlayers, foundToday } = await getTodaysWord();

  return (
    <main className="min-h-screen bg-base-100">
      <Game
        word={word}
        totalPlayers={totalPlayers}
        foundToday={foundToday}
      />
    </main>
  );
}
