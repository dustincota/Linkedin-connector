import type { BaseRecord, UUID, CampaignStatus } from './common';

export interface Campaign extends BaseRecord {
  name: string;
  description: string | null;
  status: CampaignStatus;

  // Targeting
  target_criteria: Record<string, any> | null;

  // Settings
  daily_limit: number;
  working_hours_start: string; // Time format: HH:MM
  working_hours_end: string;
  working_days: number[]; // 1=Monday, 7=Sunday
  timezone: string;

  // AI personalization
  use_ai_personalization: boolean;
  personalization_prompt: string | null;

  // Stats
  total_enrolled: number;
  total_sent: number;
  total_connected: number;
  total_replied: number;
  total_hot: number;

  // Metadata
  created_by: UUID | null;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  status?: CampaignStatus;
  target_criteria?: Record<string, any>;
  daily_limit?: number;
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: number[];
  timezone?: string;
  use_ai_personalization?: boolean;
  personalization_prompt?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string | null;
  status?: CampaignStatus;
  target_criteria?: Record<string, any> | null;
  daily_limit?: number;
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: number[];
  timezone?: string;
  use_ai_personalization?: boolean;
  personalization_prompt?: string | null;
}

export interface CampaignStep extends BaseRecord {
  campaign_id: UUID;
  step_number: number;

  // Step type
  type: 'connection_request' | 'message' | 'follow_up' | 'inmail';

  // Content
  subject: string | null;
  template: string;

  // Timing
  delay_value: number;
  delay_unit: 'minutes' | 'hours' | 'days';

  // Conditions
  condition_type: 'no_reply' | 'connected' | 'replied' | null;
}

export interface CreateCampaignStepInput {
  campaign_id: UUID;
  step_number: number;
  type: 'connection_request' | 'message' | 'follow_up' | 'inmail';
  subject?: string;
  template: string;
  delay_value?: number;
  delay_unit?: 'minutes' | 'hours' | 'days';
  condition_type?: 'no_reply' | 'connected' | 'replied' | null;
}

export interface UpdateCampaignStepInput {
  step_number?: number;
  type?: 'connection_request' | 'message' | 'follow_up' | 'inmail';
  subject?: string | null;
  template?: string;
  delay_value?: number;
  delay_unit?: 'minutes' | 'hours' | 'days';
  condition_type?: 'no_reply' | 'connected' | 'replied' | null;
}

export interface CampaignEnrollment extends BaseRecord {
  campaign_id: UUID;
  contact_id: UUID;

  // Status
  status: 'active' | 'paused' | 'completed' | 'failed';
  current_step: number;

  // Progress tracking
  enrolled_at: string;
  last_action_at: string | null;
  completed_at: string | null;

  // Metadata
  notes: string | null;
}

export interface CreateEnrollmentInput {
  campaign_id: UUID;
  contact_id: UUID;
  status?: 'active' | 'paused';
  notes?: string;
}

// Campaign with steps
export interface CampaignWithSteps extends Campaign {
  steps: CampaignStep[];
}

// Campaign analytics
export interface CampaignAnalytics {
  campaign_id: UUID;
  connections_sent: number;
  connections_accepted: number;
  connection_rate: number;
  messages_sent: number;
  messages_replied: number;
  reply_rate: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  dead_leads: number;
}
