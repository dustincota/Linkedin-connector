import type { BaseRecord, UUID, Temperature, Status, ConnectionStatus } from './common';

export interface Contact extends BaseRecord {
  company_id: UUID | null;

  // Basic info
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;

  // LinkedIn specific
  linkedin_url: string | null;
  linkedin_id: string | null;
  profile_image_url: string | null;
  headline: string | null;
  location: string | null;
  connection_status: ConnectionStatus;
  connected_at: string | null;

  // Scoring & classification
  score: number;
  temperature: Temperature;
  temperature_updated_at: string | null;

  // Tags & segmentation
  tags: string[];
  is_buyer: boolean;
  is_deal_seller: boolean;

  // Preferences & status
  status: Status;
  source: string | null;

  // Metadata
  notes: string | null;
  custom_fields: Record<string, any>;
  last_contacted_at: string | null;
}

export interface CreateContactInput {
  company_id?: UUID;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  linkedin_url?: string;
  linkedin_id?: string;
  profile_image_url?: string;
  headline?: string;
  location?: string;
  tags?: string[];
  source?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateContactInput {
  company_id?: UUID | null;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
  profile_image_url?: string | null;
  headline?: string | null;
  location?: string | null;
  connection_status?: ConnectionStatus;
  score?: number;
  temperature?: Temperature;
  tags?: string[];
  is_buyer?: boolean;
  is_deal_seller?: boolean;
  status?: Status;
  notes?: string | null;
  custom_fields?: Record<string, any>;
}

// Extended contact with company data
export interface ContactWithCompany extends Contact {
  company?: {
    id: UUID;
    name: string;
    domain: string | null;
    industry: string | null;
    linkedin_url: string | null;
  } | null;
}

// Contact with conversation count
export interface ContactWithStats extends Contact {
  conversations_count: number;
  messages_count: number;
  last_message_at: string | null;
  campaigns_count: number;
}
