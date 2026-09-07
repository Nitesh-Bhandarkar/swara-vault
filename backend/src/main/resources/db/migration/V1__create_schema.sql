-- Users
CREATE TABLE app_user (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ragas (self-referencing for Janaka relationship)
CREATE TABLE raga (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    janya BOOLEAN NOT NULL DEFAULT FALSE,
    janaka_raga_id UUID REFERENCES raga(id),
    melakarta_number INTEGER CHECK (melakarta_number BETWEEN 1 AND 72),
    arohana TEXT,
    arohana_audio_url TEXT,
    avarohana TEXT,
    avarohana_audio_url TEXT,
    is_seeded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT raga_type_check CHECK (
        (janya = TRUE AND janaka_raga_id IS NOT NULL AND melakarta_number IS NULL) OR
        (janya = FALSE AND janaka_raga_id IS NULL AND melakarta_number IS NOT NULL)
    )
);

CREATE INDEX idx_raga_melakarta ON raga (melakarta_number);

-- Compositions (Geethe, Kruthi, Keertane, Varna)
CREATE TABLE composition (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    raga_id UUID NOT NULL REFERENCES raga(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tala VARCHAR(100) NOT NULL,
    description TEXT,
    audio_url TEXT,
    CONSTRAINT composition_type_check CHECK (type IN ('GEETHE', 'KRUTHI', 'KEERTANE', 'VARNA'))
);

CREATE INDEX idx_composition_raga ON composition (raga_id);
