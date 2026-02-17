-- Dynamic Referral Rules Table
CREATE TABLE IF NOT EXISTS referral_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_type TEXT NOT NULL, -- e.g., 'plan_extension'
    reward_days INTEGER DEFAULT 0,
    plan_type TEXT DEFAULT 'pro',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default rule: 30 days of Pro plan for each successful referral
INSERT INTO referral_rules (reward_type, reward_days, plan_type)
VALUES ('plan_extension', 30, 'pro')
ON CONFLICT DO NOTHING;
