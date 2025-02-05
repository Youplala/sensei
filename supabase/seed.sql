-- Reset tables
TRUNCATE daily_words, word_similarities, user_guesses, valid_words CASCADE;

-- Insert valid words
INSERT INTO valid_words (word) VALUES
    ('montée'),
    ('ascension'),
    ('escalade'),
    ('grimpée'),
    ('élévation'),
    ('hausse'),
    ('ascendant'),
    ('escalier'),
    ('pente'),
    ('progression'),
    ('augmentation'),
    ('croissance'),
    ('accroissement'),
    ('essor'),
    ('remontée'),
    ('avancée'),
    ('développement'),
    ('progrès'),
    ('évolution'),
    ('amélioration'),
    ('expansion');

-- Insert today's word
INSERT INTO daily_words (word, date) 
VALUES ('montée', CURRENT_DATE);

-- Get the daily word ID for reference
DO $$ 
DECLARE
    daily_word_id UUID;
BEGIN
    SELECT id INTO daily_word_id FROM daily_words WHERE date = CURRENT_DATE;

    -- Insert word similarities
    INSERT INTO word_similarities (word1, word2, similarity_score) 
    VALUES 
        ('montée', 'ascension', 0.85),
        ('montée', 'escalade', 0.82),
        ('montée', 'grimpée', 0.80),
        ('montée', 'élévation', 0.78),
        ('montée', 'hausse', 0.75),
        ('montée', 'ascendant', 0.73),
        ('montée', 'escalier', 0.70),
        ('montée', 'pente', 0.68),
        ('montée', 'progression', 0.65),
        ('montée', 'augmentation', 0.63),
        ('montée', 'croissance', 0.60),
        ('montée', 'accroissement', 0.58),
        ('montée', 'essor', 0.55),
        ('montée', 'remontée', 0.53),
        ('montée', 'avancée', 0.50),
        ('montée', 'développement', 0.48),
        ('montée', 'progrès', 0.45),
        ('montée', 'évolution', 0.43),
        ('montée', 'amélioration', 0.40),
        ('montée', 'expansion', 0.38);

    -- Insert some sample user guesses
    INSERT INTO user_guesses (session_id, word, daily_word_id, temperature, progress)
    VALUES 
        ('session1', 'ascension', daily_word_id, 85, 850),
        ('session1', 'escalade', daily_word_id, 82, 820),
        ('session2', 'hausse', daily_word_id, 75, 750),
        ('session2', 'pente', daily_word_id, 68, 680),
        ('session3', 'montée', daily_word_id, 100, 1000),
        ('session4', 'montée', daily_word_id, 100, 1000),
        ('session5', 'progression', daily_word_id, 65, 650);
END $$;
