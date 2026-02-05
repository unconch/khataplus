-- Daily Reports Table
CREATE TABLE IF NOT EXISTS daily_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    report_date DATE UNIQUE NOT NULL,
    total_sale_gross DECIMAL(12, 2) NOT NULL, -- "SALE" line
    total_cost DECIMAL(12, 2) NOT NULL,        -- "PRICE" line
    expenses DECIMAL(12, 2) NOT NULL DEFAULT 0, -- "EXP" line
    cash_sale DECIMAL(12, 2) NOT NULL DEFAULT 0, -- "CASH" line
    online_sale DECIMAL(12, 2) NOT NULL DEFAULT 0, -- "ON-LINE" value
    online_cost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Bracket value
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);
