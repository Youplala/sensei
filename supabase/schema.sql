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

-- User guesses table for daily words
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
    code TEXT NOT NULL UNIQUE,
    word TEXT NOT NULL REFERENCES valid_words(word),
    created_by_name TEXT NOT NULL,
    created_by_session_id TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_finished BOOLEAN DEFAULT FALSE
);

-- Private room players table
CREATE TABLE private_room_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES private_rooms(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    has_found BOOLEAN DEFAULT FALSE,
    found_at TIMESTAMP WITH TIME ZONE,
    guesses_count INTEGER DEFAULT 0,
    best_temperature FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, session_id)
);

-- Private room guesses table
CREATE TABLE private_room_guesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES private_rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES private_room_players(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    temperature FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_daily_words_date ON daily_words(date);
CREATE INDEX idx_word_similarities_words ON word_similarities(word1, word2);
CREATE INDEX idx_user_guesses_daily_word ON user_guesses(daily_word_id);
CREATE INDEX idx_private_rooms_code ON private_rooms(code);
CREATE INDEX idx_private_room_players_room ON private_room_players(room_id);
CREATE INDEX idx_private_room_guesses_room ON private_room_guesses(room_id);
CREATE INDEX idx_private_room_players_session ON private_room_players(session_id);

-- Function to create a private room
CREATE OR REPLACE FUNCTION create_private_room(
    player_name TEXT,
    session_id TEXT
) RETURNS TABLE (
    room_id UUID,
    room_code TEXT,
    word TEXT
) AS $$
DECLARE
    random_word TEXT;
    room_code TEXT;
BEGIN
    -- Get a random word
    SELECT word INTO random_word
    FROM valid_words
    ORDER BY RANDOM()
    LIMIT 1;

    -- Generate a unique 6-character code
    room_code := UPPER(SUBSTRING(MD5(NOW()::TEXT || RANDOM()::TEXT) FROM 1 FOR 6));

    -- Create the room
    INSERT INTO private_rooms (code, word, created_by_name, created_by_session_id, expires_at)
    VALUES (room_code, random_word, player_name, session_id, NOW() + INTERVAL '24 hours')
    RETURNING id, code, word INTO room_id, room_code, random_word;

    -- Add the creator as first player
    INSERT INTO private_room_players (room_id, player_name, session_id)
    VALUES (room_id, player_name, session_id);

    RETURN QUERY SELECT room_id, room_code, random_word;
END;
$$ LANGUAGE plpgsql;

-- Function to join a private room
CREATE OR REPLACE FUNCTION join_private_room(
    room_code TEXT,
    player_name TEXT,
    session_id TEXT
) RETURNS TABLE (
    room_id UUID,
    word TEXT,
    created_by_name TEXT,
    player_count INTEGER
) AS $$
DECLARE
    v_room_id UUID;
    v_word TEXT;
    v_created_by_name TEXT;
    v_player_count INTEGER;
BEGIN
    -- Get room info
    SELECT id, word, created_by_name
    INTO v_room_id, v_word, v_created_by_name
    FROM private_rooms
    WHERE code = room_code
    AND expires_at > NOW()
    AND NOT is_finished;

    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'Room not found or expired';
    END IF;

    -- Add player if not already in room
    INSERT INTO private_room_players (room_id, player_name, session_id)
    VALUES (v_room_id, player_name, session_id)
    ON CONFLICT (room_id, session_id) 
    DO UPDATE SET player_name = EXCLUDED.player_name, last_active_at = NOW();

    -- Get player count
    SELECT COUNT(*) INTO v_player_count
    FROM private_room_players
    WHERE room_id = v_room_id;

    RETURN QUERY
    SELECT v_room_id, v_word, v_created_by_name, v_player_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get room status
CREATE OR REPLACE FUNCTION get_room_status(
    p_room_id UUID,
    p_session_id TEXT
) RETURNS TABLE (
    word TEXT,
    is_finished BOOLEAN,
    player_name TEXT,
    player_count INTEGER,
    found_count INTEGER,
    has_found BOOLEAN,
    created_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH room_stats AS (
        SELECT 
            r.word,
            r.is_finished,
            r.created_by_name,
            COUNT(DISTINCT p.id) as player_count,
            COUNT(DISTINCT CASE WHEN p.has_found THEN p.id END) as found_count
        FROM private_rooms r
        LEFT JOIN private_room_players p ON p.room_id = r.id
        WHERE r.id = p_room_id
        GROUP BY r.word, r.is_finished, r.created_by_name
    )
    SELECT 
        rs.word,
        rs.is_finished,
        p.player_name,
        rs.player_count,
        rs.found_count,
        p.has_found,
        rs.created_by_name
    FROM room_stats rs
    LEFT JOIN private_room_players p ON p.room_id = p_room_id AND p.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;
