ALTER TABLE composition DROP CONSTRAINT composition_type_check;
ALTER TABLE composition ADD CONSTRAINT composition_type_check
    CHECK (type IN ('GEETHE', 'JATHI_SWARA', 'KRUTHI', 'KEERTANE', 'VARNA'));
