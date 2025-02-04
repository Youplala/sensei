export const getCurrentDay = () => {
  return new Date().toISOString().split('T')[0];
};

export const getTemperatureColor = (temperature: number): string => {
  if (temperature === 100) return 'text-success';
  if (temperature >= 80) return 'text-warning';
  if (temperature >= 50) return 'text-info';
  if (temperature >= 30) return 'text-accent';
  return 'text-base-content/60';
};

export const getProgressBarColor = (temperature: number): string => {
  if (temperature === 100) return 'bg-success';
  if (temperature >= 80) return 'bg-warning';
  if (temperature >= 50) return 'bg-info';
  if (temperature >= 30) return 'bg-accent';
  return 'bg-base-content/20';
};

export const getTemperatureEmoji = (temperature: number): string => {
  if (temperature === 100) return '🎯';
  if (temperature >= 80) return '🔥';
  if (temperature >= 50) return '☀️';
  if (temperature >= 30) return '❄️';
  return '🧊';
};
