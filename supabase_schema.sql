-- Supabase SQL schema for Папина рыбалка

CREATE TABLE IF NOT EXISTS fishing_records (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    water_body_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    place_description TEXT,
    total_fish_count INTEGER NOT NULL DEFAULT 0,
    total_weight DOUBLE PRECISION,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fishing_records_user ON fishing_records(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_fishing_records_date ON fishing_records(date DESC);

CREATE TABLE IF NOT EXISTS catch_items (
    id BIGSERIAL PRIMARY KEY,
    fishing_record_id BIGINT NOT NULL REFERENCES fishing_records(id) ON DELETE CASCADE,
    fish_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    biggest_weight DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_catch_items_record ON catch_items(fishing_record_id);

CREATE TABLE IF NOT EXISTS fishing_photos (
    id BIGSERIAL PRIMARY KEY,
    fishing_record_id BIGINT NOT NULL REFERENCES fishing_records(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fishing_photos_record ON fishing_photos(fishing_record_id);

CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(telegram_user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(telegram_user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fishing_records_updated_at
    BEFORE UPDATE ON fishing_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Storage bucket: create "fishing-photos" bucket in Supabase Storage
