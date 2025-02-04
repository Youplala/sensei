-- Create tables for the semantic word game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Valid words table
CREATE TABLE valid_words (
    word TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily words table
CREATE TABLE daily_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word TEXT NOT NULL REFERENCES valid_words(word),
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Word similarities table
CREATE TABLE word_similarities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word1 TEXT NOT NULL REFERENCES valid_words(word),
    word2 TEXT NOT NULL REFERENCES valid_words(word),
    similarity_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word1, word2)
);

-- User guesses table
CREATE TABLE user_guesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    word TEXT NOT NULL,
    daily_word_id UUID REFERENCES daily_words(id),
    temperature FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Private rooms table
CREATE TABLE private_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT NOT NULL UNIQUE,
    custom_word TEXT NOT NULL,
    created_by TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Private room guesses table
CREATE TABLE private_room_guesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES private_rooms(id),
    session_id TEXT NOT NULL,
    word TEXT NOT NULL,
    temperature FLOAT NOT NULL,
    progress INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_daily_words_date ON daily_words(date);
CREATE INDEX idx_word_similarities_words ON word_similarities(word1, word2);
CREATE INDEX idx_user_guesses_daily_word ON user_guesses(daily_word_id);
CREATE INDEX idx_private_room_guesses_room ON private_room_guesses(room_id);

-- Create function to get today's word
CREATE OR REPLACE FUNCTION get_todays_word()
RETURNS TABLE (
    word TEXT,
    total_players BIGINT,
    found_today BIGINT
) AS $$
DECLARE
    today_word TEXT;
BEGIN
    -- First try to get today's word
    SELECT dw.word INTO today_word
    FROM daily_words dw
    WHERE dw.date = CURRENT_DATE;

    -- If no word exists for today, insert a default one
    IF today_word IS NULL THEN
        today_word := 'montée';
        INSERT INTO daily_words (word, date) 
        VALUES (today_word, CURRENT_DATE)
        ON CONFLICT (date) DO NOTHING;
    END IF;

    -- Return the word with stats
    RETURN QUERY
    SELECT 
        dw.word,
        COALESCE(COUNT(DISTINCT ug.session_id), 0) as total_players,
        COALESCE(COUNT(DISTINCT CASE WHEN ug.temperature = 100 THEN ug.session_id END), 0) as found_today
    FROM daily_words dw
    LEFT JOIN user_guesses ug ON dw.id = ug.daily_word_id
    WHERE dw.date = CURRENT_DATE
    GROUP BY dw.word;

    -- If still no results (shouldn't happen), return default values
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            today_word::TEXT,
            0::BIGINT,
            0::BIGINT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get today's stats
CREATE OR REPLACE FUNCTION get_todays_stats()
RETURNS TABLE (
    total_players BIGINT,
    found_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ug.session_id) as total_players,
        COUNT(DISTINCT CASE WHEN ug.temperature = 100 THEN ug.session_id END) as found_today
    FROM daily_words dw
    LEFT JOIN user_guesses ug ON dw.id = ug.daily_word_id
    WHERE dw.date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check word validity and get similarity
CREATE OR REPLACE FUNCTION check_word(input_word TEXT, target_word TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH validity AS (
        SELECT EXISTS (
            SELECT 1 FROM valid_words WHERE word = input_word
        ) as is_valid
    ),
    similarity AS (
        SELECT COALESCE(ws.similarity_score, 0) as similarity_score
        FROM validity
        LEFT JOIN word_similarities ws 
        ON ws.word1 = target_word AND ws.word2 = input_word
    )
    SELECT 
        validity.is_valid,
        similarity.similarity_score
    FROM validity, similarity;
END;
$$ LANGUAGE plpgsql;
