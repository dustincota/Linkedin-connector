-- Demo Data Seed Script
-- Run this in Supabase SQL Editor to create demo data

-- Insert Companies
INSERT INTO companies (name, domain, industry, size) VALUES
('TechCorp Solutions', 'techcorp.com', 'Software', '51-200'),
('Growth Ventures', 'growthventures.io', 'Venture Capital', '11-50')
RETURNING *;

-- Get company IDs (you'll see these in the output above)
-- Replace the UUIDs below with the actual IDs from the output

-- Insert Contacts
INSERT INTO contacts (
  first_name, last_name, email, title, temperature, score,
  headline, location, connection_status, tags, source
) VALUES
-- HOT Leads
('Sarah', 'Johnson', 'sarah@techcorp.com', 'VP of Sales', 'HOT', 9,
 'VP of Sales at TechCorp | B2B SaaS Expert', 'San Francisco, CA', 'connected',
 ARRAY['decision-maker', 'saas'], 'demo'),

('Mike', 'Chen', 'mike@techcorp.com', 'Head of Marketing', 'HOT', 8,
 'Marketing Leader | Growth Hacker', 'Austin, TX', 'connected',
 ARRAY['marketing', 'growth'], 'demo'),

-- WARM Leads
('Jessica', 'Williams', 'jessica@growthventures.io', 'Partner', 'WARM', 7,
 'VC Partner | Early Stage Investor', 'New York, NY', 'connected',
 ARRAY['investor', 'vc'], 'demo'),

('David', 'Martinez', 'david.martinez@email.com', 'CEO', 'WARM', 6,
 'CEO & Founder | E-commerce', 'Los Angeles, CA', 'pending',
 ARRAY['founder', 'ecommerce'], 'demo'),

('Emily', 'Taylor', 'emily@startup.com', 'Product Manager', 'WARM', 6,
 'Product Manager | SaaS', 'Seattle, WA', 'connected',
 ARRAY['product'], 'demo'),

-- COLD Leads
('Robert', 'Anderson', 'robert@company.com', 'Director of Operations', 'COLD', 4,
 'Operations Director', 'Chicago, IL', 'not_connected', ARRAY[]::text[], 'demo'),

('Lisa', 'Thompson', 'lisa@business.com', 'Sales Manager', 'COLD', 5,
 'Sales Professional', 'Boston, MA', 'not_connected', ARRAY[]::text[], 'demo'),

('James', 'Wilson', 'james@corp.com', 'Account Executive', 'COLD', 3,
 'Account Executive', 'Miami, FL', 'not_connected', ARRAY[]::text[], 'demo'),

('Maria', 'Garcia', 'maria@enterprise.com', 'Business Development', 'COLD', 4,
 'BD Manager', 'Denver, CO', 'not_connected', ARRAY[]::text[], 'demo'),

('Chris', 'Brown', 'chris@company.io', 'CTO', 'COLD', 5,
 'Chief Technology Officer', 'Portland, OR', 'not_connected', ARRAY[]::text[], 'demo');

-- Insert Campaigns
INSERT INTO campaigns (
  name, description, status, daily_limit, use_ai_personalization,
  total_enrolled, total_sent, total_connected, total_replied, total_hot
) VALUES
('SaaS Founders Outreach',
 'Target SaaS founders for partnership opportunities',
 'active', 20, true, 15, 12, 8, 5, 2),

('VC Partnership Campaign',
 'Connect with VCs for deal flow partnership',
 'active', 10, true, 8, 6, 4, 2, 1);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Demo data created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- 2 companies';
  RAISE NOTICE '- 10 contacts (2 HOT, 3 WARM, 5 COLD)';
  RAISE NOTICE '- 2 active campaigns';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run "npm run dev" and open http://localhost:3000';
END $$;
