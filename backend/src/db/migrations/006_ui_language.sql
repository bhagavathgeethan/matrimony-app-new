-- Interface language each member chose in the app (shared/i18n.js codes). Notifications are written
-- and pushed in this language.
ALTER TABLE users
  ADD COLUMN ui_language VARCHAR(5) NOT NULL DEFAULT 'en'
    CHECK (ui_language IN ('en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'or'));
