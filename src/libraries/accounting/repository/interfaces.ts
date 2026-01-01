import type {
  Account,
  AccountId,
  AccountType,
  AllocationItem,
  CostAllocation,
  CostAllocationId,
  DateRangeOptions,
  JournalEntry,
  JournalEntryId,
  NewAccount,
  NewAllocationItem,
  NewCostAllocation,
  NewJournalEntry,
  NewPosting,
  NewUnit,
  Posting,
  QueryOptions,
  Unit,
  UnitId,
} from '../core/types';

/**
 * Repository for account (chart of accounts) operations
 */
export interface IAccountRepository {
  /**
   * Find account by ID
   */
  findById(id: AccountId): Promise<Account | null>;

  /**
   * Find account by code
   */
  findByCode(code: string): Promise<Account | null>;

  /**
   * Find all accounts
   */
  findAll(): Promise<Account[]>;

  /**
   * Find accounts by type
   */
  findByType(type: AccountType): Promise<Account[]>;

  /**
   * Find active accounts only
   */
  findActive(): Promise<Account[]>;

  /**
   * Save a new account
   */
  save(account: NewAccount): Promise<Account>;

  /**
   * Update an existing account
   */
  update(id: AccountId, updates: Partial<Account>): Promise<Account>;

  /**
   * Deactivate an account (soft delete)
   */
  deactivate(id: AccountId): Promise<void>;
}

/**
 * Repository for journal entry operations
 */
export interface IJournalRepository {
  /**
   * Find journal entry by ID
   */
  findById(id: JournalEntryId): Promise<JournalEntry | null>;

  /**
   * Find journal entries by date range
   */
  findByDateRange(start: Date, end: Date): Promise<JournalEntry[]>;

  /**
   * Find journal entries that reference a specific account
   */
  findByAccount(accountId: AccountId, options?: QueryOptions): Promise<JournalEntry[]>;

  /**
   * Find all journal entries
   */
  findAll(options?: QueryOptions): Promise<JournalEntry[]>;

  /**
   * Save a new journal entry
   */
  save(entry: NewJournalEntry): Promise<JournalEntry>;

  /**
   * Mark a journal entry as reversed
   */
  markReversed(id: JournalEntryId, reversedById: JournalEntryId): Promise<void>;
}

/**
 * Repository for posting operations
 */
export interface IPostingRepository {
  /**
   * Find postings by journal entry ID
   */
  findByJournalEntry(entryId: JournalEntryId): Promise<Posting[]>;

  /**
   * Find postings by account ID with optional date range
   */
  findByAccount(accountId: AccountId, options?: DateRangeOptions): Promise<Posting[]>;

  /**
   * Save multiple postings (used when creating a journal entry)
   */
  saveAll(journalEntryId: JournalEntryId, postings: NewPosting[]): Promise<Posting[]>;
}

/**
 * Repository for cost allocation operations
 */
export interface IAllocationRepository {
  /**
   * Find cost allocation by journal entry ID
   */
  findByJournalEntry(entryId: JournalEntryId): Promise<CostAllocation | null>;

  /**
   * Find cost allocation by ID
   */
  findById(id: CostAllocationId): Promise<CostAllocation | null>;

  /**
   * Find all allocation items for an allocation
   */
  findItemsByAllocation(allocationId: CostAllocationId): Promise<AllocationItem[]>;

  /**
   * Save a new cost allocation
   */
  save(allocation: NewCostAllocation): Promise<CostAllocation>;

  /**
   * Save allocation items
   */
  saveItems(allocationId: CostAllocationId, items: NewAllocationItem[]): Promise<AllocationItem[]>;
}

/**
 * Repository for unit operations
 */
export interface IUnitRepository {
  /**
   * Find unit by ID
   */
  findById(id: UnitId): Promise<Unit | null>;

  /**
   * Find unit by unit number
   */
  findByUnitNumber(unitNumber: string): Promise<Unit | null>;

  /**
   * Find all units
   */
  findAll(): Promise<Unit[]>;

  /**
   * Get total ownership shares across all units
   */
  getTotalShares(): Promise<number>;

  /**
   * Save a new unit
   */
  save(unit: NewUnit): Promise<Unit>;

  /**
   * Update an existing unit
   */
  update(id: UnitId, updates: Partial<Unit>): Promise<Unit>;
}

/**
 * Combined repository interface with transaction support
 */
export interface IAccountingRepository {
  accounts: IAccountRepository;
  journal: IJournalRepository;
  postings: IPostingRepository;
  allocations: IAllocationRepository;
  units: IUnitRepository;

  /**
   * Execute a function within a database transaction
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
