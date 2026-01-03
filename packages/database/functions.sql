-- Database functions for campaign stats and operations

-- Increment campaign sent count
CREATE OR REPLACE FUNCTION increment_campaign_sent(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET total_sent = total_sent + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment campaign connected count
CREATE OR REPLACE FUNCTION increment_campaign_connected(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET total_connected = total_connected + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment campaign replied count
CREATE OR REPLACE FUNCTION increment_campaign_replied(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET total_replied = total_replied + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment campaign hot leads count
CREATE OR REPLACE FUNCTION increment_campaign_hot(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET total_hot = total_hot + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
