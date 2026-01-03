import type { BaseRecord, UUID, Priority, TaskStatus } from './common';

export interface Task extends BaseRecord {
  // Task details
  title: string;
  description: string | null;
  priority: Priority;

  // Assignment
  assigned_to: UUID | null;

  // Related entities
  contact_id: UUID | null;
  deal_id: UUID | null;
  campaign_id: UUID | null;

  // Status
  status: TaskStatus;

  // Dates
  due_date: string | null;
  completed_at: string | null;

  // Source
  source: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  assigned_to?: UUID;
  contact_id?: UUID;
  deal_id?: UUID;
  campaign_id?: UUID;
  status?: TaskStatus;
  due_date?: string;
  source?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  assigned_to?: UUID | null;
  contact_id?: UUID | null;
  deal_id?: UUID | null;
  campaign_id?: UUID | null;
  status?: TaskStatus;
  due_date?: string | null;
  completed_at?: string | null;
  source?: string | null;
}

// Task with related entity details
export interface TaskWithRelations extends Task {
  contact?: {
    id: UUID;
    first_name: string;
    last_name: string;
  } | null;
  deal?: {
    id: UUID;
    name: string;
  } | null;
  campaign?: {
    id: UUID;
    name: string;
  } | null;
}
