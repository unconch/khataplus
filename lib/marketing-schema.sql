-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    platforms TEXT[] DEFAULT '{}', -- ['facebook', 'instagram', 'twitter', 'linkedin']
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'posted', 'archived'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    media_url TEXT,
    
    -- Performance Metrics (JSONB)
    metrics JSONB DEFAULT '{
        "impressions": 0,
        "clicks": 0,
        "engagement": 0,
        "spend": 0
    }'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for status and scheduling
CREATE INDEX IF NOT EXISTS idx_marketing_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_scheduled ON marketing_campaigns(scheduled_at);
