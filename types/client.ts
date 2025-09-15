export interface ClientPackage {
  packageName: string | null;
  totalSessions: number;
  sessionsRemaining: number;
  pricePerSession: number;
}

export interface ClientDates {
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionHistoryEntry {
  id: string;
  completedAt: string;
}

export interface Client {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  notes: string | null;
  package: ClientPackage;
  dates: ClientDates;
  sessionHistory: SessionHistoryEntry[];
}

export interface ClientInput {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags?: string[];
  notes?: string | null;
  package?: Partial<ClientPackage>;
  dates?: Partial<Omit<ClientDates, 'createdAt' | 'updatedAt'>>;
}

export type SortField = 'name' | 'updatedAt' | 'sessionsRemaining';
export type SortDirection = 'asc' | 'desc';

export interface ListClientsParams {
  search?: string;
  sortBy?: SortField;
  sortDir?: SortDirection;
  limit?: number;
  offset?: number;
}