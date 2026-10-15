-- Personal details (basic, religious, professional, location, family, hobbies).
-- Field definitions and validation live in shared/profileFields.js; name, city and profession keep their own columns.

ALTER TABLE users ADD COLUMN details JSONB NOT NULL DEFAULT '{}'::jsonb;
