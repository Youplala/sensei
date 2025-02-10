import { Game } from '@/components/Game';
import { initializeGame } from '@/lib/initializeGame';

export default async function Home() {
  const { todaysWord } = await initializeGame();

  return (
    <main className="min-h-screen">
      <Game word={todaysWord} />
    </main>
  );
}
