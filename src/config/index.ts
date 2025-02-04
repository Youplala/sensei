interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
}

const config: Config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default config;
