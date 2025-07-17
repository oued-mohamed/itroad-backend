// services/property-service/src/types/client.ts
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: 'buyer' | 'seller' | 'renter' | 'landlord';
  status: 'active' | 'inactive' | 'closed';
  address?: string;
  notes?: string;
  tags: string[];
  propertyInterests: string[];
  transactions: string[];
  source: 'referral' | 'website' | 'social-media' | 'advertisement' | 'direct' | 'other';
  budget?: {
    min?: number;
    max?: number;
    preApproved?: boolean;
  };
  timeline?: {
    urgency: 'immediate' | 'within-month' | 'within-3-months' | 'within-6-months' | 'flexible';
    moveInDate?: Date;
  };
  nextFollowUpDate?: Date | string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientNote {
  id: string;
  content: string;
  type: 'general' | 'showing' | 'follow-up' | 'important';
  createdAt: Date;
  updatedBy?: string;
}

export interface ClientFilter {
  type?: 'buyer' | 'seller' | 'renter' | 'landlord' | ('buyer' | 'seller' | 'renter' | 'landlord')[];
  status?: 'active' | 'inactive' | 'closed' | ('active' | 'inactive' | 'closed')[];
  search?: string;
  source?: string;
  minBudget?: number;
  maxBudget?: number;
  timeline?: string[];
  agentId?: string;
}

export interface ClientSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  filters?: ClientFilter;
}