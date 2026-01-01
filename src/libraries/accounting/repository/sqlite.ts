import Database from '@tauri-apps/plugin-sql';
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
import {
  createAccountId,
  createAllocationItemId,
  createCostAllocationId,
  createJournalEntryId,
  createPostingId,
  createUnitId,
} from '../core/types';
import {
  IAccountRepository,
  IAccountingRepository,
  IAllocationRepository,
  IJournalRepository,
  IPostingRepository,
  IUnitRepository,
} from './interfaces';
import { EntityNotFoundError } from '../core/errors';

// Helper to generate UUIDs
function generateId(): string {
  return crypto.randomUUID();
}

// Helper to format dates for SQLite
function formatDate(date: Date): string {
  return date.toISOString();
}

// Helper to parse dates from SQLite
function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * SQLite implementation of IAccountRepository
 */
class SqliteAccountRepository implements IAccountRepository {
  constructor(private db: Database) {}

  async findById(id: AccountId): Promise<Account | null> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );

    return result.length > 0 ? this.mapToAccount(result[0]) : null;
  }

  async findByCode(code: string): Promise<Account | null> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM accounts WHERE code = $1',
      [code]
    );

    return result.length > 0 ? this.mapToAccount(result[0]) : null;
  }

  async findAll(): Promise<Account[]> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM accounts ORDER BY code'
    );

    return result.map(row => this.mapToAccount(row));
  }

  async findByType(type: AccountType): Promise<Account[]> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM accounts WHERE type = $1 ORDER BY code',
      [type]
    );

    return result.map(row => this.mapToAccount(row));
  }

  async findActive(): Promise<Account[]> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM accounts WHERE is_active = TRUE ORDER BY code'
    );

    return result.map(row => this.mapToAccount(row));
  }

  async save(account: NewAccount): Promise<Account> {
    const id = createAccountId(generateId());
    const now = formatDate(new Date());

    await this.db.execute(
      `INSERT INTO accounts (id, code, name, type, parent_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        account.code,
        account.name,
        account.type,
        account.parentId || null,
        account.isActive !== false,
        now,
      ]
    );

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Failed to save account');
    }

    return saved;
  }

  async update(id: AccountId, updates: Partial<Account>): Promise<Account> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Account', id);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }
    if (updates.parentId !== undefined) {
      fields.push(`parent_id = $${paramIndex++}`);
      values.push(updates.parentId);
    }

    if (fields.length > 0) {
      values.push(id);
      await this.db.execute(
        `UPDATE accounts SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to update account');
    }

    return updated;
  }

  async deactivate(id: AccountId): Promise<void> {
    await this.db.execute('UPDATE accounts SET is_active = FALSE WHERE id = $1', [id]);
  }

  private mapToAccount(row: any): Account {
    return {
      id: createAccountId(row.id),
      code: row.code,
      name: row.name,
      type: row.type as AccountType,
      parentId: row.parent_id ? createAccountId(row.parent_id) : undefined,
      isActive: Boolean(row.is_active),
      createdAt: parseDate(row.created_at),
    };
  }
}

/**
 * SQLite implementation of IJournalRepository
 */
class SqliteJournalRepository implements IJournalRepository {
  constructor(private db: Database) {}

  async findById(id: JournalEntryId): Promise<JournalEntry | null> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM journal_entries WHERE id = $1',
      [id]
    );

    return result.length > 0 ? this.mapToJournalEntry(result[0]) : null;
  }

  async findByDateRange(start: Date, end: Date): Promise<JournalEntry[]> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM journal_entries WHERE date BETWEEN $1 AND $2 ORDER BY date DESC',
      [formatDate(start), formatDate(end)]
    );

    return result.map(row => this.mapToJournalEntry(row));
  }

  async findByAccount(accountId: AccountId, options?: QueryOptions): Promise<JournalEntry[]> {
    let query = `
      SELECT DISTINCT je.* FROM journal_entries je
      INNER JOIN postings p ON p.journal_entry_id = je.id
      WHERE p.account_id = $1
    `;

    const params: any[] = [accountId];
    let paramIndex = 2;

    if (options?.startDate) {
      query += ` AND je.date >= $${paramIndex++}`;
      params.push(formatDate(options.startDate));
    }

    if (options?.endDate) {
      query += ` AND je.date <= $${paramIndex++}`;
      params.push(formatDate(options.endDate));
    }

    query += ' ORDER BY je.date DESC';

    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await this.db.select<any[]>(query, params);
    return result.map(row => this.mapToJournalEntry(row));
  }

  async findAll(options?: QueryOptions): Promise<JournalEntry[]> {
    let query = 'SELECT * FROM journal_entries';
    const params: any[] = [];
    let paramIndex = 1;

    const conditions: string[] = [];

    if (options?.startDate) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(formatDate(options.startDate));
    }

    if (options?.endDate) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(formatDate(options.endDate));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';

    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await this.db.select<any[]>(query, params);
    return result.map(row => this.mapToJournalEntry(row));
  }

  async save(entry: NewJournalEntry): Promise<JournalEntry> {
    const id = createJournalEntryId(generateId());
    const now = formatDate(new Date());

    await this.db.execute(
      `INSERT INTO journal_entries (id, date, description, reference, is_reversed, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        formatDate(entry.date),
        entry.description,
        entry.reference || null,
        false,
        entry.createdBy,
        now,
      ]
    );

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Failed to save journal entry');
    }

    return saved;
  }

  async markReversed(id: JournalEntryId, reversedById: JournalEntryId): Promise<void> {
    await this.db.execute(
      'UPDATE journal_entries SET is_reversed = TRUE, reversed_by_id = $1 WHERE id = $2',
      [reversedById, id]
    );
  }

  private mapToJournalEntry(row: any): JournalEntry {
    return {
      id: createJournalEntryId(row.id),
      date: parseDate(row.date),
      description: row.description,
      reference: row.reference || undefined,
      isReversed: Boolean(row.is_reversed),
      reversedById: row.reversed_by_id ? createJournalEntryId(row.reversed_by_id) : undefined,
      reversalOfId: row.reversal_of_id ? createJournalEntryId(row.reversal_of_id) : undefined,
      createdBy: row.created_by,
      createdAt: parseDate(row.created_at),
    };
  }
}

/**
 * SQLite implementation of IPostingRepository
 */
class SqlitePostingRepository implements IPostingRepository {
  constructor(private db: Database) {}

  async findByJournalEntry(entryId: JournalEntryId): Promise<Posting[]> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM postings WHERE journal_entry_id = $1 ORDER BY created_at',
      [entryId]
    );

    return result.map(row => this.mapToPosting(row));
  }

  async findByAccount(accountId: AccountId, options?: DateRangeOptions): Promise<Posting[]> {
    let query = `
      SELECT p.* FROM postings p
      INNER JOIN journal_entries je ON je.id = p.journal_entry_id
      WHERE p.account_id = $1
    `;

    const params: any[] = [accountId];
    let paramIndex = 2;

    if (options?.startDate) {
      query += ` AND je.date >= $${paramIndex++}`;
      params.push(formatDate(options.startDate));
    }

    if (options?.endDate) {
      query += ` AND je.date <= $${paramIndex++}`;
      params.push(formatDate(options.endDate));
    }

    query += ' ORDER BY je.date, p.created_at';

    const result = await this.db.select<any[]>(query, params);
    return result.map(row => this.mapToPosting(row));
  }

  async saveAll(journalEntryId: JournalEntryId, postings: NewPosting[]): Promise<Posting[]> {
    const saved: Posting[] = [];

    for (const posting of postings) {
      const id = createPostingId(generateId());
      const now = formatDate(new Date());

      await this.db.execute(
        `INSERT INTO postings (id, journal_entry_id, account_id, amount, type, memo, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          journalEntryId,
          posting.accountId,
          posting.amount,
          posting.type,
          posting.memo || null,
          now,
        ]
      );

      saved.push({
        id,
        journalEntryId,
        accountId: posting.accountId,
        amount: posting.amount,
        type: posting.type,
        memo: posting.memo,
        createdAt: new Date(),
      });
    }

    return saved;
  }

  private mapToPosting(row: any): Posting {
    return {
      id: createPostingId(row.id),
      journalEntryId: createJournalEntryId(row.journal_entry_id),
      accountId: createAccountId(row.account_id),
      amount: row.amount,
      type: row.type,
      memo: row.memo || undefined,
      createdAt: parseDate(row.created_at),
    };
  }
}

/**
 * SQLite implementation of IAllocationRepository
 */
class SqliteAllocationRepository implements IAllocationRepository {
  constructor(private db: Database) {}

  async findByJournalEntry(entryId: JournalEntryId): Promise<CostAllocation | null> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM cost_allocations WHERE journal_entry_id = $1',
      [entryId]
    );

    return result.length > 0 ? this.mapToAllocation(result[0]) : null;
  }

  async findById(id: CostAllocationId): Promise<CostAllocation | null> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM cost_allocations WHERE id = $1',
      [id]
    );

    return result.length > 0 ? this.mapToAllocation(result[0]) : null;
  }

  async findItemsByAllocation(allocationId: CostAllocationId): Promise<AllocationItem[]> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM allocation_items WHERE allocation_id = $1 ORDER BY unit_identifier',
      [allocationId]
    );

    return result.map(row => this.mapToAllocationItem(row));
  }

  async save(allocation: NewCostAllocation): Promise<CostAllocation> {
    const id = createCostAllocationId(generateId());
    const now = formatDate(new Date());

    await this.db.execute(
      `INSERT INTO cost_allocations (id, journal_entry_id, allocation_type, total_amount, currency, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        allocation.journalEntryId,
        allocation.allocationType,
        allocation.totalAmount,
        allocation.currency,
        allocation.metadata ? JSON.stringify(allocation.metadata) : null,
        now,
      ]
    );

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Failed to save cost allocation');
    }

    return saved;
  }

  async saveItems(
    allocationId: CostAllocationId,
    items: NewAllocationItem[]
  ): Promise<AllocationItem[]> {
    const saved: AllocationItem[] = [];

    for (const item of items) {
      const id = createAllocationItemId(generateId());
      const now = formatDate(new Date());

      await this.db.execute(
        `INSERT INTO allocation_items (id, allocation_id, unit_id, unit_identifier, share_value, usage_value, allocated_amount, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          allocationId,
          item.unitId,
          item.unitIdentifier,
          item.shareValue || null,
          item.usageValue || null,
          item.allocatedAmount,
          now,
        ]
      );

      saved.push({
        id,
        allocationId,
        unitId: item.unitId,
        unitIdentifier: item.unitIdentifier,
        shareValue: item.shareValue,
        usageValue: item.usageValue,
        allocatedAmount: item.allocatedAmount,
        createdAt: new Date(),
      });
    }

    return saved;
  }

  private mapToAllocation(row: any): CostAllocation {
    return {
      id: createCostAllocationId(row.id),
      journalEntryId: createJournalEntryId(row.journal_entry_id),
      allocationType: row.allocation_type,
      totalAmount: row.total_amount,
      currency: row.currency,
      metadata: row.metadata || undefined,
      createdAt: parseDate(row.created_at),
    };
  }

  private mapToAllocationItem(row: any): AllocationItem {
    return {
      id: createAllocationItemId(row.id),
      allocationId: createCostAllocationId(row.allocation_id),
      unitId: createUnitId(row.unit_id),
      unitIdentifier: row.unit_identifier,
      shareValue: row.share_value || undefined,
      usageValue: row.usage_value || undefined,
      allocatedAmount: row.allocated_amount,
      createdAt: parseDate(row.created_at),
    };
  }
}

/**
 * SQLite implementation of IUnitRepository
 */
class SqliteUnitRepository implements IUnitRepository {
  constructor(private db: Database) {}

  async findById(id: UnitId): Promise<Unit | null> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM units WHERE id = $1',
      [id]
    );

    return result.length > 0 ? this.mapToUnit(result[0]) : null;
  }

  async findByUnitNumber(unitNumber: string): Promise<Unit | null> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM units WHERE unit_number = $1',
      [unitNumber]
    );

    return result.length > 0 ? this.mapToUnit(result[0]) : null;
  }

  async findAll(): Promise<Unit[]> {
    const result = await this.db.select<any[]>(
      'SELECT * FROM units ORDER BY unit_number'
    );

    return result.map(row => this.mapToUnit(row));
  }

  async getTotalShares(): Promise<number> {
    const result = await this.db.select<any[]>(
      'SELECT SUM(ownership_shares) as total FROM units'
    );

    return result[0]?.total || 0;
  }

  async save(unit: NewUnit): Promise<Unit> {
    const id = createUnitId(generateId());
    const now = formatDate(new Date());

    await this.db.execute(
      `INSERT INTO units (id, unit_number, owner_id, ownership_shares, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, unit.unitNumber, unit.ownerId || null, unit.ownershipShares, now]
    );

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Failed to save unit');
    }

    return saved;
  }

  async update(id: UnitId, updates: Partial<Unit>): Promise<Unit> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Unit', id);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.unitNumber !== undefined) {
      fields.push(`unit_number = $${paramIndex++}`);
      values.push(updates.unitNumber);
    }
    if (updates.ownerId !== undefined) {
      fields.push(`owner_id = $${paramIndex++}`);
      values.push(updates.ownerId);
    }
    if (updates.ownershipShares !== undefined) {
      fields.push(`ownership_shares = $${paramIndex++}`);
      values.push(updates.ownershipShares);
    }

    if (fields.length > 0) {
      values.push(id);
      await this.db.execute(
        `UPDATE units SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to update unit');
    }

    return updated;
  }

  private mapToUnit(row: any): Unit {
    return {
      id: createUnitId(row.id),
      unitNumber: row.unit_number,
      ownerId: row.owner_id || undefined,
      ownershipShares: row.ownership_shares,
      createdAt: parseDate(row.created_at),
    };
  }
}

/**
 * Combined repository implementation with transaction support
 */
class SqliteAccountingRepository implements IAccountingRepository {
  public accounts: IAccountRepository;
  public journal: IJournalRepository;
  public postings: IPostingRepository;
  public allocations: IAllocationRepository;
  public units: IUnitRepository;

  constructor(private db: Database) {
    this.accounts = new SqliteAccountRepository(db);
    this.journal = new SqliteJournalRepository(db);
    this.postings = new SqlitePostingRepository(db);
    this.allocations = new SqliteAllocationRepository(db);
    this.units = new SqliteUnitRepository(db);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.db.execute('BEGIN TRANSACTION');

    try {
      const result = await fn();
      await this.db.execute('COMMIT');
      return result;
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }
}

/**
 * Factory function to create a SQLite repository
 */
export function createSqliteRepository(db: Database): IAccountingRepository {
  return new SqliteAccountingRepository(db);
}
