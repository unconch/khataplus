CREATE SCHEMA IF NOT EXISTS demo_feedback;

CREATE TABLE IF NOT EXISTS demo_feedback.feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page TEXT NOT NULL DEFAULT 'roadmap',
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    contact_email TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_feature_requests_submitted_at
    ON demo_feedback.feature_requests (submitted_at DESC);
