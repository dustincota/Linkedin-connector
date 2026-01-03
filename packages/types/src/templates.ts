import type { BaseRecord, UUID } from './common';

export interface Template extends BaseRecord {
  name: string;
  category: string | null;
  subject: string | null;
  body: string;
  variables: string[];
  use_count: number;
}

export interface CreateTemplateInput {
  name: string;
  category?: string;
  subject?: string;
  body: string;
  variables?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  category?: string | null;
  subject?: string | null;
  body?: string;
  variables?: string[];
}
