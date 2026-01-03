import type { BaseRecord, UUID } from './common';

export interface Buyer extends BaseRecord {
  contact_id: UUID;

  // Buyer criteria
  industries: string[];
  min_revenue: number | null;
  max_revenue: number | null;
  min_ebitda: number | null;
  max_ebitda: number | null;
  geographies: string[];

  // Preferences
  investment_thesis: string | null;
  custom_criteria: Record<string, any>;

  // Status
  status: 'active' | 'inactive';
}

export interface CreateBuyerInput {
  contact_id: UUID;
  industries?: string[];
  min_revenue?: number;
  max_revenue?: number;
  min_ebitda?: number;
  max_ebitda?: number;
  geographies?: string[];
  investment_thesis?: string;
  custom_criteria?: Record<string, any>;
  status?: 'active' | 'inactive';
}

export interface UpdateBuyerInput {
  industries?: string[];
  min_revenue?: number | null;
  max_revenue?: number | null;
  min_ebitda?: number | null;
  max_ebitda?: number | null;
  geographies?: string[];
  investment_thesis?: string | null;
  custom_criteria?: Record<string, any>;
  status?: 'active' | 'inactive';
}

export interface BuyerMatch extends BaseRecord {
  buyer_id: UUID;
  deal_id: UUID;

  // Scoring
  match_score: number | null;
  match_reason: string | null;

  // Outreach tracking
  status: 'pending' | 'contacted' | 'interested' | 'passed';
  contacted_at: string | null;
  responded_at: string | null;
}

export interface CreateBuyerMatchInput {
  buyer_id: UUID;
  deal_id: UUID;
  match_score?: number;
  match_reason?: string;
  status?: 'pending' | 'contacted' | 'interested' | 'passed';
}

export interface UpdateBuyerMatchInput {
  match_score?: number | null;
  match_reason?: string | null;
  status?: 'pending' | 'contacted' | 'interested' | 'passed';
  contacted_at?: string | null;
  responded_at?: string | null;
}

// Buyer with contact details
export interface BuyerWithContact extends Buyer {
  contact: {
    id: UUID;
    first_name: string;
    last_name: string;
    email: string | null;
    company_id: UUID | null;
  };
}

// Buyer match with buyer and deal details
export interface BuyerMatchWithDetails extends BuyerMatch {
  buyer: {
    id: UUID;
    contact_id: UUID;
    investment_thesis: string | null;
  };
  deal: {
    id: UUID;
    name: string;
    revenue: number | null;
    ebitda: number | null;
  };
}
