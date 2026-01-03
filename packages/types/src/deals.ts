import type { BaseRecord, UUID, DealStage, DealStatus } from './common';

export interface Deal extends BaseRecord {
  contact_id: UUID | null;
  company_id: UUID | null;

  // Basic info
  name: string;
  description: string | null;

  // Financials
  asking_price: number | null;
  revenue: number | null;
  ebitda: number | null;
  multiple: number | null;

  // Valuation (AI-generated)
  valuation_min: number | null;
  valuation_max: number | null;
  valuation_notes: string | null;
  valuation_updated_at: string | null;

  // Stage
  stage: DealStage;

  // Status
  status: DealStatus;

  // Key dates
  intake_date: string | null;
  target_close_date: string | null;
  closed_date: string | null;

  // Metadata
  custom_fields: Record<string, any>;
}

export interface CreateDealInput {
  contact_id?: UUID;
  company_id?: UUID;
  name: string;
  description?: string;
  asking_price?: number;
  revenue?: number;
  ebitda?: number;
  stage?: DealStage;
  status?: DealStatus;
  intake_date?: string;
  target_close_date?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateDealInput {
  contact_id?: UUID | null;
  company_id?: UUID | null;
  name?: string;
  description?: string | null;
  asking_price?: number | null;
  revenue?: number | null;
  ebitda?: number | null;
  multiple?: number | null;
  valuation_min?: number | null;
  valuation_max?: number | null;
  valuation_notes?: string | null;
  stage?: DealStage;
  status?: DealStatus;
  intake_date?: string | null;
  target_close_date?: string | null;
  closed_date?: string | null;
  custom_fields?: Record<string, any>;
}

export interface DealDocument extends BaseRecord {
  deal_id: UUID;
  name: string;
  type: string | null;
  file_url: string;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by: UUID | null;
}

export interface CreateDealDocumentInput {
  deal_id: UUID;
  name: string;
  type?: string;
  file_url: string;
  file_size?: number;
  uploaded_by?: UUID;
}

// Deal with documents
export interface DealWithDocuments extends Deal {
  documents: DealDocument[];
}

// Deal with contact and company
export interface DealWithRelations extends Deal {
  contact?: {
    id: UUID;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  company?: {
    id: UUID;
    name: string;
    industry: string | null;
  } | null;
}
