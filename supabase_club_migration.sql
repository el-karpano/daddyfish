-- Migration: Single-user → Fishing Club
-- Run this SQL in Supabase SQL Editor AFTER the original schema

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT DEFAULT '',
    username TEXT DEFAULT '',
    avatar_url TEXT,
    color TEXT NOT NULL DEFAULT '#20D879',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- 2. Clubs table (single club)
CREATE TABLE IF NOT EXISTS clubs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Наш рыбацкий клуб',
    owner_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Club members
CREATE TABLE IF NOT EXISTS club_members (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);

-- 4. Club invites
CREATE TABLE IF NOT EXISTS club_invites (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_invites_token ON club_invites(token);

-- 5. Add user_id to fishing_records
ALTER TABLE fishing_records ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_fishing_records_user_id ON fishing_records(user_id);

-- 6. Update user_achievements to use user_id
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- 7. Add updated_at trigger to users
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MIGRATION: Create owner user from existing ALLOWED_TELEGRAM_IDS
-- Replace YOUR_TELEGRAM_ID below with the actual Telegram ID
-- ============================================================
--
-- INSERT INTO users (telegram_id, first_name, color)
-- VALUES (YOUR_TELEGRAM_ID, 'Папа', '#20D879')
-- ON CONFLICT (telegram_id) DO NOTHING;
--
-- INSERT INTO clubs (name, owner_user_id)
-- SELECT 'Наш рыбацкий клуб', id FROM users WHERE telegram_id = YOUR_TELEGRAM_ID
-- ON CONFLICT DO NOTHING;
--
-- INSERT INTO club_members (club_id, user_id, role)
-- SELECT c.id, u.id, 'owner'
-- FROM clubs c, users u
-- WHERE u.telegram_id = YOUR_TELEGRAM_ID
-- ON CONFLICT DO NOTHING;
--
-- UPDATE fishing_records SET user_id = (
--     SELECT id FROM users WHERE telegram_id = YOUR_TELEGRAM_ID
-- ) WHERE user_id IS NULL;
--
-- UPDATE user_achievements SET user_id = (
--     SELECT id FROM users WHERE telegram_id = YOUR_TELEGRAM_ID
-- ) WHERE user_id IS NULL;