-- LinkedIn CRM Business OS Database Schema
-- Supabase PostgreSQL Schema
--
-- INSTRUCTIONS: Copy this ENTIRE file and paste into Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- CORE CRM TABLES
-- ============================================================================

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT, -- e.g., "1-10", "11-50", "51-200", etc.
  description TEXT,
  linkedin_url TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_domain ON companies(domain);

-- Contacts table (all people: leads, connections, buyers)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Basic info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,

  -- LinkedIn specific
  linkedin_url TEXT UNIQUE,
  linkedin_id TEXT,
  profile_image_url TEXT,
  headline TEXT,
  location TEXT,
  connection_status TEXT DEFAULT 'not_connected', -- not_connected, pending, connected
  connected_at TIMESTAMPTZ,

  -- Scoring & classification
  score INTEGER DEFAULT 0, -- 1-10 relevance score from Claude
  temperature TEXT DEFAULT 'COLD', -- HOT, WARM, COLD, DEAD
  temperature_updated_at TIMESTAMPTZ,

  -- Tags & segmentation
  tags TEXT[] DEFAULT '{}',
  is_buyer BOOLEAN DEFAULT FALSE,
  is_deal_seller BOOLEAN DEFAULT FALSE,

  -- Preferences & status
  status TEXT DEFAULT 'active', -- active, archived, do_not_contact
  source TEXT, -- e.g., "apollo", "csv_import", "linkedin_search", "comment_engagement"

  -- Metadata
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_linkedin_url ON contacts(linkedin_url);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_temperature ON contacts(temperature);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_tags ON contacts USING gin(tags);
CREATE INDEX idx_contacts_score ON contacts(score);

-- ============================================================================
-- CAMPAIGNS & OUTREACH
-- ============================================================================

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed

  -- Targeting
  target_criteria JSONB, -- Filters for which contacts to enroll

  -- Settings
  daily_limit INTEGER DEFAULT 50,
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '17:00',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
  timezone TEXT DEFAULT 'America/New_York',

  -- AI personalization
  use_ai_personalization BOOLEAN DEFAULT TRUE,
  personalization_prompt TEXT,

  -- Stats
  total_enrolled INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_connected INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_hot INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID -- Reference to user, if multi-user
);

CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Campaign steps (sequence steps within a campaign)
CREATE TABLE campaign_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,

  -- Step type
  type TEXT NOT NULL, -- 'connection_request', 'message', 'follow_up', 'inmail'

  -- Content
  subject TEXT, -- For InMail
  template TEXT NOT NULL,

  -- Timing
  delay_value INTEGER DEFAULT 1,
  delay_unit TEXT DEFAULT 'days', -- minutes, hours, days

  -- Conditions
  condition_type TEXT, -- null, 'no_reply', 'connected', 'replied'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, step_number)
);

CREATE INDEX idx_campaign_steps_campaign_id ON campaign_steps(campaign_id);

-- Campaign enrollments (which contacts are in which campaigns)
CREATE TABLE campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'active', -- active, paused, completed, failed
  current_step INTEGER DEFAULT 1,

  -- Progress tracking
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,

  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_campaign_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX idx_campaign_enrollments_contact_id ON campaign_enrollments(contact_id);
CREATE INDEX idx_campaign_enrollments_status ON campaign_enrollments(status);

-- Outreach attempts (log of all connection requests and messages sent)
CREATE TABLE outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  campaign_step_id UUID REFERENCES campaign_steps(id) ON DELETE SET NULL,

  -- Type
  type TEXT NOT NULL, -- 'connection_request', 'message', 'inmail'

  -- Content
  subject TEXT,
  message TEXT,
  personalized_message TEXT, -- AI-personalized version

  -- Status
  status TEXT DEFAULT 'pending', -- pending, sent, failed, accepted, replied

  -- Response tracking
  replied_at TIMESTAMPTZ,
  reply_message TEXT,

  -- Metadata
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_contact_id ON outreach(contact_id);
CREATE INDEX idx_outreach_campaign_id ON outreach(campaign_id);
CREATE INDEX idx_outreach_status ON outreach(status);
CREATE INDEX idx_outreach_sent_at ON outreach(sent_at);

-- ============================================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================================

-- Conversations (threaded LinkedIn conversations)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- LinkedIn specific
  linkedin_conversation_id TEXT UNIQUE,

  -- Status
  status TEXT DEFAULT 'active', -- active, archived

  -- Classification
  temperature TEXT DEFAULT 'COLD', -- HOT, WARM, COLD, DEAD
  temperature_reason TEXT, -- Claude's explanation

  -- Tracking
  last_message_at TIMESTAMPTZ,
  last_message_from TEXT, -- 'user' or 'contact'
  unread_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX idx_conversations_temperature ON conversations(temperature);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);

-- Messages (individual messages within conversations)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Content
  message TEXT NOT NULL,

  -- Sender
  direction TEXT NOT NULL, -- 'outbound' (from us), 'inbound' (from contact)

  -- LinkedIn specific
  linkedin_message_id TEXT UNIQUE,

  -- AI analysis
  sentiment TEXT, -- positive, neutral, negative
  intent TEXT, -- question, objection, interest, etc.

  -- Status
  is_read BOOLEAN DEFAULT FALSE,

  -- Metadata
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_messages_direction ON messages(direction);

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT, -- connection_request, first_message, follow_up, etc.
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}', -- e.g., [{{first_name}}, {{company}}]
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category);

-- ============================================================================
-- DEALS & M&A PIPELINE
-- ============================================================================

-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Seller contact
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Financials
  asking_price DECIMAL,
  revenue DECIMAL,
  ebitda DECIMAL,
  multiple DECIMAL,

  -- Valuation (AI-generated)
  valuation_min DECIMAL,
  valuation_max DECIMAL,
  valuation_notes TEXT,
  valuation_updated_at TIMESTAMPTZ,

  -- Stage
  stage TEXT DEFAULT 'intake', -- intake, valuation, marketing, loi, due_diligence, closing, closed

  -- Status
  status TEXT DEFAULT 'active', -- active, paused, closed_won, closed_lost

  -- Key dates
  intake_date DATE,
  target_close_date DATE,
  closed_date DATE,

  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);

-- Deal documents
CREATE TABLE deal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT, -- cim, nda, loi, financials, etc.
  file_url TEXT NOT NULL,
  file_size INTEGER,

  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID
);

CREATE INDEX idx_deal_documents_deal_id ON deal_documents(deal_id);

-- ============================================================================
-- BUYERS
-- ============================================================================

-- Buyers table
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Buyer criteria
  industries TEXT[] DEFAULT '{}',
  min_revenue DECIMAL,
  max_revenue DECIMAL,
  min_ebitda DECIMAL,
  max_ebitda DECIMAL,
  geographies TEXT[] DEFAULT '{}',

  -- Preferences
  investment_thesis TEXT,
  custom_criteria JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'active', -- active, inactive

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_buyers_status ON buyers(status);
CREATE INDEX idx_buyers_contact_id ON buyers(contact_id);

-- Buyer-deal matches
CREATE TABLE buyer_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  -- Scoring
  match_score INTEGER, -- 1-100, AI-calculated fit
  match_reason TEXT, -- Claude's explanation

  -- Outreach tracking
  status TEXT DEFAULT 'pending', -- pending, contacted, interested, passed
  contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(buyer_id, deal_id)
);

CREATE INDEX idx_buyer_matches_buyer_id ON buyer_matches(buyer_id);
CREATE INDEX idx_buyer_matches_deal_id ON buyer_matches(deal_id);
CREATE INDEX idx_buyer_matches_match_score ON buyer_matches(match_score);

-- ============================================================================
-- CONTENT & RESEARCH
-- ============================================================================

-- Content ideas (from research agent)
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  source TEXT, -- news, trend, manual
  source_url TEXT,
  angle TEXT, -- How to approach this topic
  priority INTEGER DEFAULT 5, -- 1-10
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, published
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_priority ON content_ideas(priority DESC);

-- Content (posts, articles)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,

  -- Content
  title TEXT,
  body TEXT NOT NULL,
  content_type TEXT DEFAULT 'linkedin_post', -- linkedin_post, article, twitter

  -- Media
  media_urls TEXT[] DEFAULT '{}',

  -- Scheduling
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Performance
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,

  -- LinkedIn specific
  linkedin_post_id TEXT,
  linkedin_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_scheduled_for ON content(scheduled_for);

-- ============================================================================
-- TASKS & OPERATIONS
-- ============================================================================

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent

  -- Assignment
  assigned_to UUID, -- User reference

  -- Related entities
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled

  -- Dates
  due_date DATE,
  completed_at TIMESTAMPTZ,

  -- Source
  source TEXT, -- manual, email_monitor, deal_agent, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX idx_tasks_deal_id ON tasks(deal_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Notification details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- hot_lead, task_reminder, agent_error, etc.
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent

  -- Delivery
  channel TEXT DEFAULT 'in_app', -- in_app, pushover, email
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Related entities
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_delivered ON notifications(delivered);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- AGENTS & AUTOMATION
-- ============================================================================

-- Agent runs (execution log)
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Agent info
  agent_name TEXT NOT NULL,
  agent_type TEXT, -- linkedin, prospecting, content, admin, deal, buyer

  -- Execution
  status TEXT DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results
  actions_taken INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,

  -- Logs
  log_data JSONB DEFAULT '{}',
  error_message TEXT,

  -- Metadata
  triggered_by TEXT, -- schedule, manual, webhook
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_agent_name ON agent_runs(agent_name);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_started_at ON agent_runs(started_at);

-- Activity log (audit trail)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Entity
  entity_type TEXT NOT NULL, -- contact, campaign, deal, etc.
  entity_id UUID NOT NULL,

  -- Action
  action TEXT NOT NULL, -- created, updated, deleted, status_changed, etc.
  changes JSONB, -- Before/after values

  -- Actor
  actor_type TEXT DEFAULT 'user', -- user, agent, system
  actor_id UUID,
  agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- ============================================================================
-- SETTINGS & CONFIG
-- ============================================================================

-- System settings (key-value store)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search profiles (targeting criteria for LinkedIn scraping)
CREATE TABLE search_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,

  -- Search criteria
  keywords TEXT[] DEFAULT '{}',
  titles TEXT[] DEFAULT '{}',
  companies TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',

  -- Filters
  connection_level TEXT, -- 1st, 2nd, 3rd
  current_company BOOLEAN,

  -- Status
  status TEXT DEFAULT 'active',
  last_scraped_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_profiles_status ON search_profiles(status);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_steps_updated_at BEFORE UPDATE ON campaign_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON buyers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_matches_updated_at BEFORE UPDATE ON buyer_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_profiles_updated_at BEFORE UPDATE ON search_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update contact last_contacted_at when outreach is sent
CREATE OR REPLACE FUNCTION update_contact_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' THEN
    UPDATE contacts
    SET last_contacted_at = NEW.sent_at
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_last_contacted_trigger
AFTER INSERT OR UPDATE ON outreach
FOR EACH ROW EXECUTE FUNCTION update_contact_last_contacted();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.sent_at,
    last_message_from = CASE WHEN NEW.direction = 'outbound' THEN 'user' ELSE 'contact' END,
    unread_count = CASE WHEN NEW.direction = 'inbound' THEN unread_count + 1 ELSE unread_count END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Function to sync contact temperature with conversation temperature
CREATE OR REPLACE FUNCTION sync_contact_temperature()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET
    temperature = NEW.temperature,
    temperature_updated_at = NOW()
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_contact_temperature_trigger
AFTER UPDATE OF temperature ON conversations
FOR EACH ROW EXECUTE FUNCTION sync_contact_temperature();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Note: Enable RLS when implementing multi-user auth
-- For now, using service role key in agents and anon key in app

-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view all contacts" ON contacts FOR SELECT USING (true);
-- ... add more policies as needed

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Additional indexes for common query patterns

-- Full-text search on contact names
CREATE INDEX idx_contacts_fulltext ON contacts USING gin(
  to_tsvector('english', first_name || ' ' || last_name)
);

-- Full-text search on company names
CREATE INDEX idx_companies_fulltext ON companies USING gin(
  to_tsvector('english', name)
);

-- Composite index for campaign performance queries
CREATE INDEX idx_campaign_enrollments_campaign_status ON campaign_enrollments(campaign_id, status);

-- Composite index for hot lead queries
CREATE INDEX idx_contacts_temperature_status ON contacts(temperature, status) WHERE temperature = 'HOT';

-- Index for unread messages
CREATE INDEX idx_messages_unread ON messages(is_read, conversation_id) WHERE is_read = FALSE;
