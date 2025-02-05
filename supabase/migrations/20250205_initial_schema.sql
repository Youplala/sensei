-- Create daily words table
CREATE TABLE daily_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  similarities JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_word_per_day UNIQUE (DATE(created_at))
);

-- Create user guesses table
CREATE TABLE user_guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  word TEXT NOT NULL,
  similarity FLOAT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster daily word lookup
CREATE INDEX idx_daily_words_date ON daily_words (DATE(created_at));

-- Create index for user guesses analysis
CREATE INDEX idx_user_guesses_session ON user_guesses (session_id, created_at);

-- Function to get today's word
CREATE OR REPLACE FUNCTION get_todays_word()
RETURNS TABLE (
  word TEXT,
  total_players BIGINT,
  found_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT COUNT(DISTINCT session_id) as total_players,
           COUNT(DISTINCT CASE WHEN is_correct THEN session_id END) as found_today
    FROM user_guesses
    WHERE DATE(created_at) = CURRENT_DATE
  )
  SELECT dw.word, s.total_players, s.found_today
  FROM daily_words dw
  CROSS JOIN stats s
  WHERE DATE(dw.created_at) = CURRENT_DATE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
