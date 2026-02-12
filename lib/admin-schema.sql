-- 1. Beta Waitlist
CREATE TABLE IF NOT EXISTS beta_waitlist (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    platform TEXT, -- 'web', 'android', 'ios'
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'invited'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Global System Announcements
CREATE TABLE IF NOT EXISTS system_announcements (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'urgent'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 3. HSN Master Data
CREATE TABLE IF NOT EXISTS hsn_master (
    id SERIAL PRIMARY KEY,
    hsn_code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    gst_rate NUMERIC,
    chapter TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
