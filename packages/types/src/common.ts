// Common types used across the application

export type UUID = string;

export type Temperature = 'HOT' | 'WARM' | 'COLD' | 'DEAD';

export type Status = 'active' | 'inactive' | 'archived' | 'do_not_contact';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export type ConnectionStatus = 'not_connected' | 'pending' | 'connected';

export type OutreachType = 'connection_request' | 'message' | 'inmail';

export type OutreachStatus = 'pending' | 'sent' | 'failed' | 'accepted' | 'replied';

export type MessageDirection = 'outbound' | 'inbound';

export type DealStage =
  | 'intake'
  | 'valuation'
  | 'marketing'
  | 'loi'
  | 'due_diligence'
  | 'closing'
  | 'closed';

export type DealStatus = 'active' | 'paused' | 'closed_won' | 'closed_lost';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type AgentType = 'linkedin' | 'prospecting' | 'content' | 'admin' | 'deal' | 'buyer';

export type AgentStatus = 'running' | 'completed' | 'failed';

export type NotificationChannel = 'in_app' | 'pushover' | 'email';

export type ContentType = 'linkedin_post' | 'article' | 'twitter';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';

// Base interface for all database records
export interface BaseRecord {
  id: UUID;
  created_at: string;
  updated_at: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filters
export interface FilterParams {
  search?: string;
  status?: string;
  temperature?: Temperature;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

// Sort
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}
