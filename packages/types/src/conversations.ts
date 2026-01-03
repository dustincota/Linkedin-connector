import type { BaseRecord, UUID, Temperature } from './common';

export interface Conversation extends BaseRecord {
  contact_id: UUID;
  campaign_id: UUID | null;

  // LinkedIn specific
  linkedin_conversation_id: string | null;

  // Status
  status: 'active' | 'archived';

  // Classification
  temperature: Temperature;
  temperature_reason: string | null;

  // Tracking
  last_message_at: string | null;
  last_message_from: 'user' | 'contact' | null;
  unread_count: number;
}

export interface CreateConversationInput {
  contact_id: UUID;
  campaign_id?: UUID;
  linkedin_conversation_id?: string;
  temperature?: Temperature;
}

export interface UpdateConversationInput {
  status?: 'active' | 'archived';
  temperature?: Temperature;
  temperature_reason?: string | null;
  unread_count?: number;
}

// Conversation with contact details
export interface ConversationWithContact extends Conversation {
  contact: {
    id: UUID;
    first_name: string;
    last_name: string;
    profile_image_url: string | null;
    title: string | null;
    company_id: UUID | null;
  };
}

// Conversation with messages
export interface ConversationWithMessages extends ConversationWithContact {
  messages: Array<{
    id: UUID;
    message: string;
    direction: 'outbound' | 'inbound';
    sent_at: string;
    is_read: boolean;
  }>;
}
