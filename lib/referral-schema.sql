-- Referral System Schema

-- Add referral code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES profiles(id),
    referred_id UUID UNIQUE REFERENCES profiles(id),
    status TEXT DEFAULT 'pending', -- pending, successful, rewarded
    reward_granted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Function to generate a random referral code if not provided
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE
    code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    WHILE NOT done LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        BEGIN
            INSERT INTO profiles (referral_code) VALUES (code) ON CONFLICT DO NOTHING;
            IF FOUND THEN
                done := TRUE;
            END IF;
        END;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;
