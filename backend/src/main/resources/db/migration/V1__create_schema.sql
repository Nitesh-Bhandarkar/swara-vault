-- Users
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ragas (self-referencing for Janaka relationship)
CREATE TABLE raga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_raga_name ON raga (LOWER(name));
CREATE INDEX idx_raga_melakarta ON raga (melakarta_number);

-- Compositions (Geethe, Kruthi, Keertane, Varna)
CREATE TABLE composition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raga_id UUID NOT NULL REFERENCES raga(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('GEETHE', 'KRUTHI', 'KEERTANE', 'VARNA')),
    name VARCHAR(255) NOT NULL,
    tala VARCHAR(100) NOT NULL,
    description TEXT,
    audio_url TEXT
);

CREATE INDEX idx_composition_raga ON composition (raga_id);

-- Spring Session JDBC tables
CREATE TABLE spring_session (
    primary_id CHAR(36) NOT NULL,
    session_id CHAR(36) NOT NULL,
    creation_time BIGINT NOT NULL,
    last_access_time BIGINT NOT NULL,
    max_inactive_interval INT NOT NULL,
    expiry_time BIGINT NOT NULL,
    principal_name VARCHAR(100),
    CONSTRAINT spring_session_pk PRIMARY KEY (primary_id)
);

CREATE UNIQUE INDEX spring_session_ix1 ON spring_session (session_id);
CREATE INDEX spring_session_ix2 ON spring_session (expiry_time);
CREATE INDEX spring_session_ix3 ON spring_session (principal_name);

CREATE TABLE spring_session_attributes (
    session_primary_id CHAR(36) NOT NULL,
    attribute_name VARCHAR(200) NOT NULL,
    attribute_bytes BYTEA NOT NULL,
    CONSTRAINT spring_session_attributes_pk PRIMARY KEY (session_primary_id, attribute_name),
    CONSTRAINT spring_session_attributes_fk FOREIGN KEY (session_primary_id)
        REFERENCES spring_session(primary_id) ON DELETE CASCADE
);
