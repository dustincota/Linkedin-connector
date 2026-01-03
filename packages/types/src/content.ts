import type { BaseRecord, UUID, ContentType, ContentStatus } from './common';

export interface ContentIdea extends BaseRecord {
  topic: string;
  source: string | null;
  source_url: string | null;
  angle: string | null;
  priority: number;
  status: 'pending' | 'approved' | 'rejected' | 'published';
}

export interface CreateContentIdeaInput {
  topic: string;
  source?: string;
  source_url?: string;
  angle?: string;
  priority?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface UpdateContentIdeaInput {
  topic?: string;
  source?: string | null;
  source_url?: string | null;
  angle?: string | null;
  priority?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'published';
}

export interface Content extends BaseRecord {
  content_idea_id: UUID | null;

  // Content
  title: string | null;
  body: string;
  content_type: ContentType;

  // Media
  media_urls: string[];

  // Scheduling
  status: ContentStatus;
  scheduled_for: string | null;
  published_at: string | null;

  // Performance
  likes: number;
  comments: number;
  shares: number;
  views: number;

  // LinkedIn specific
  linkedin_post_id: string | null;
  linkedin_url: string | null;
}

export interface CreateContentInput {
  content_idea_id?: UUID;
  title?: string;
  body: string;
  content_type?: ContentType;
  media_urls?: string[];
  status?: ContentStatus;
  scheduled_for?: string;
}

export interface UpdateContentInput {
  content_idea_id?: UUID | null;
  title?: string | null;
  body?: string;
  content_type?: ContentType;
  media_urls?: string[];
  status?: ContentStatus;
  scheduled_for?: string | null;
  published_at?: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  linkedin_post_id?: string | null;
  linkedin_url?: string | null;
}

// Content with performance metrics
export interface ContentWithMetrics extends Content {
  engagement_rate: number;
  total_engagement: number;
}
