import type { BaseRecord, UUID, MessageDirection } from './common';

export interface Message extends BaseRecord {
  conversation_id: UUID;
  contact_id: UUID;

  // Content
  message: string;

  // Sender
  direction: MessageDirection;

  // LinkedIn specific
  linkedin_message_id: string | null;

  // AI analysis
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  intent: string | null;

  // Status
  is_read: boolean;

  // Metadata
  sent_at: string;
}

export interface CreateMessageInput {
  conversation_id: UUID;
  contact_id: UUID;
  message: string;
  direction: MessageDirection;
  linkedin_message_id?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
  sent_at?: string;
}

export interface UpdateMessageInput {
  is_read?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  intent?: string | null;
}

// Outreach tracking
export interface Outreach extends BaseRecord {
  contact_id: UUID;
  campaign_id: UUID | null;
  campaign_step_id: UUID | null;

  // Type
  type: 'connection_request' | 'message' | 'inmail';

  // Content
  subject: string | null;
  message: string | null;
  personalized_message: string | null;

  // Status
  status: 'pending' | 'sent' | 'failed' | 'accepted' | 'replied';

  // Response tracking
  replied_at: string | null;
  reply_message: string | null;

  // Metadata
  sent_at: string | null;
  error_message: string | null;
}

export interface CreateOutreachInput {
  contact_id: UUID;
  campaign_id?: UUID;
  campaign_step_id?: UUID;
  type: 'connection_request' | 'message' | 'inmail';
  subject?: string;
  message?: string;
  personalized_message?: string;
}

export interface UpdateOutreachInput {
  status?: 'pending' | 'sent' | 'failed' | 'accepted' | 'replied';
  sent_at?: string;
  replied_at?: string | null;
  reply_message?: string | null;
  error_message?: string | null;
}
