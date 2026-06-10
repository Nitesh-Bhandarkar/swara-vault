-- Multi-audio support: replace single audio_url column with a collection table
CREATE TABLE composition_audio_url (
    composition_id UUID NOT NULL REFERENCES composition(id) ON DELETE CASCADE,
    audio_url      TEXT NOT NULL,
    position       INT  NOT NULL DEFAULT 0
);

-- Migrate any existing single audio URLs into the new table
INSERT INTO composition_audio_url (composition_id, audio_url, position)
SELECT id, audio_url, 0
FROM composition
WHERE audio_url IS NOT NULL;

ALTER TABLE composition DROP COLUMN audio_url;
