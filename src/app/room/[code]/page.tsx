import { getTodaysWord } from "@/lib/supabase";
import { RoomContent } from "@/components/RoomContent";

interface RoomPageProps {
  params: {
    code: string;
  };
  searchParams: {
    name?: string;
  };
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { word, totalPlayers, foundToday } = await getTodaysWord();
  const { code } = params;
  const { name } = searchParams;

  return (
    <RoomContent
      code={code}
      word={word}
      totalPlayers={totalPlayers}
      foundToday={foundToday}
      name={name}
    />
  );
}
