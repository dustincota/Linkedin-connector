import type { UUID } from './common';

export interface Setting {
  key: string;
  value: Record<string, any>;
  description: string | null;
  updated_at: string;
}

export interface UpsertSettingInput {
  key: string;
  value: Record<string, any>;
  description?: string;
}

export interface SearchProfile {
  id: UUID;
  name: string;

  // Search criteria
  keywords: string[];
  titles: string[];
  companies: string[];
  industries: string[];
  locations: string[];

  // Filters
  connection_level: string | null;
  current_company: boolean | null;

  // Status
  status: 'active' | 'inactive';
  last_scraped_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateSearchProfileInput {
  name: string;
  keywords?: string[];
  titles?: string[];
  companies?: string[];
  industries?: string[];
  locations?: string[];
  connection_level?: string;
  current_company?: boolean;
  status?: 'active' | 'inactive';
}

export interface UpdateSearchProfileInput {
  name?: string;
  keywords?: string[];
  titles?: string[];
  companies?: string[];
  industries?: string[];
  locations?: string[];
  connection_level?: string | null;
  current_company?: boolean | null;
  status?: 'active' | 'inactive';
  last_scraped_at?: string | null;
}
