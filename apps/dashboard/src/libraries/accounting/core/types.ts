// Branded types for type-safe IDs
export type AccountId = string & { readonly __brand: 'AccountId' };
export type JournalEntryId = string & { readonly __brand: 'JournalEntryId' };
export type PostingId = string & { readonly __brand: 'PostingId' };
export type CostAllocationId = string & { readonly __brand: 'CostAllocationId' };
export type AllocationItemId = string & { readonly __brand: 'AllocationItemId' };
export type UnitId = string & { readonly __brand: 'UnitId' };

// Helper functions to create branded IDs
export const createAccountId = (id: string): AccountId => id as AccountId;
export const createJournalEntryId = (id: string): JournalEntryId => id as JournalEntryId;
export const createPostingId = (id: string): PostingId => id as PostingId;
export const createCostAllocationId = (id: string): CostAllocationId => id as CostAllocationId;
export const createAllocationItemId = (id: string): AllocationItemId => id as AllocationItemId;
export const createUnitId = (id: string): UnitId => id as UnitId;

// Account Types
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

// Posting Types
export type PostingType = 'debit' | 'credit';

// Account
export interface Account {
  id: AccountId;
  code: string;
  name: string;
  type: AccountType;
  parentId?: AccountId;
  isActive: boolean;
  createdAt: Date;
}

export interface NewAccount {
  code: string;
  name: string;
  type: AccountType;
  parentId?: AccountId;
  isActive?: boolean;
}

export interface DefaultAccount {
  code: string;
  name: string;
  type: AccountType;
}

// Journal Entry
export interface JournalEntry {
  id: JournalEntryId;
  date: Date;
  description: string;
  reference?: string;
  isReversed: boolean;
  reversedById?: JournalEntryId;
  reversalOfId?: JournalEntryId;
  createdBy: string;
  createdAt: Date;
}

export interface NewJournalEntry {
  date: Date;
  description: string;
  reference?: string;
  createdBy: string;
}

export interface JournalEntryWithPostings extends JournalEntry {
  postings: Posting[];
}

// Posting
export interface Posting {
  id: PostingId;
  journalEntryId: JournalEntryId;
  accountId: AccountId;
  amount: string; // Stored as string to preserve precision
  type: PostingType;
  memo?: string;
  createdAt: Date;
}

export interface NewPosting {
  accountId: AccountId;
  amount: string; // Can accept Money.toString() or raw string
  type: PostingType;
  memo?: string;
}

// Cost Allocation
export interface CostAllocation {
  id: CostAllocationId;
  journalEntryId: JournalEntryId;
  allocationType: string;
  totalAmount: string;
  currency: string;
  metadata?: string; // JSON string
  createdAt: Date;
}

export interface NewCostAllocation {
  journalEntryId: JournalEntryId;
  allocationType: string;
  totalAmount: string;
  currency: string;
  metadata?: Record<string, any>;
}

// Allocation Item
export interface AllocationItem {
  id: AllocationItemId;
  allocationId: CostAllocationId;
  unitId: UnitId;
  unitIdentifier: string;
  shareValue?: string;
  usageValue?: string;
  allocatedAmount: string;
  createdAt: Date;
}

export interface NewAllocationItem {
  unitId: UnitId;
  unitIdentifier: string;
  shareValue?: string;
  usageValue?: string;
  allocatedAmount: string;
}

// Unit
export interface Unit {
  id: UnitId;
  unitNumber: string;
  ownerId?: string;
  ownershipShares: number;
  createdAt: Date;
}

export interface NewUnit {
  unitNumber: string;
  ownerId?: string;
  ownershipShares: number;
}

// Query Options
export interface DateRangeOptions {
  startDate?: Date;
  endDate?: Date;
}

export interface QueryOptions extends DateRangeOptions {
  limit?: number;
  offset?: number;
}

// Rounding modes for Money class
export enum RoundingMode {
  ROUND_UP = 0,
  ROUND_DOWN = 1,
  ROUND_HALF_UP = 4,
  ROUND_HALF_DOWN = 5,
}
