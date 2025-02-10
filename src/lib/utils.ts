export const getCurrentDay = () => {
  return new Date().toISOString().split('T')[0];
};

export const getTemperatureColor = (temp: number) => {
  if (temp >= 70) return 'text-red-500';
  if (temp >= 50) return 'text-orange-500';
  if (temp >= 30) return 'text-yellow-500';
  return 'text-blue-500';
};

export const getTemperatureEmoji = (temp: number) => {
  if (temp >= 70) return '🔥';
  if (temp >= 50) return '🌡️';
  if (temp >= 30) return '😊';
  return '❄️';
};

export const getProgressBarColor = (temp: number) => {
  if (temp >= 70) return 'bg-red-500';
  if (temp >= 50) return 'bg-orange-500';
  if (temp >= 30) return 'bg-yellow-500';
  return 'bg-blue-500';
};

export const formatRank = (rank: number | null): string => {
  if (rank === null) return '(cold)';
  if (rank === 1000) return 'Found it!';
  return `${rank}/1000`;
};