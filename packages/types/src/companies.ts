import type { BaseRecord, UUID } from './common';

export interface Company extends BaseRecord {
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  description: string | null;
  linkedin_url: string | null;
  website: string | null;
  location: string | null;
}

export interface CreateCompanyInput {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  description?: string;
  linkedin_url?: string;
  website?: string;
  location?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  description?: string | null;
  linkedin_url?: string | null;
  website?: string | null;
  location?: string | null;
}

// Company with contact count
export interface CompanyWithStats extends Company {
  contacts_count: number;
}
