import type { BaseRecord, UUID, Priority, NotificationChannel } from './common';

export interface Notification extends BaseRecord {
  // Notification details
  title: string;
  message: string;
  type: string | null;
  priority: Priority;

  // Delivery
  channel: NotificationChannel;
  delivered: boolean;
  delivered_at: string | null;

  // Status
  read: boolean;
  read_at: string | null;

  // Related entities
  contact_id: UUID | null;
  deal_id: UUID | null;
  task_id: UUID | null;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: string;
  priority?: Priority;
  channel?: NotificationChannel;
  contact_id?: UUID;
  deal_id?: UUID;
  task_id?: UUID;
}

export interface UpdateNotificationInput {
  delivered?: boolean;
  delivered_at?: string;
  read?: boolean;
  read_at?: string;
}
