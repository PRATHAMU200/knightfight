-- Enable pgcrypto extension for UUID generation (only once per DB)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    unique_match_id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Players table (optional, for future use)
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

-- Match roles table
CREATE TABLE match_roles (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('white', 'black', 'spectator')),
    link_id UUID NOT NULL DEFAULT gen_random_uuid(),
    player_id INTEGER REFERENCES players(id),
    can_play BOOLEAN DEFAULT FALSE,
    can_spectate BOOLEAN DEFAULT TRUE
);
