import Database from '@tauri-apps/plugin-sql';
import { createSqliteRepository } from './repository/sqlite';
import { createJournalService, type JournalService } from './operations/journal';
import { createLedgerService, type LedgerService } from './operations/ledger';
import { createTrialBalanceService, type TrialBalanceService } from './operations/trial-balance';
import { createAllocationService, type AllocationService } from './operations/allocation';
import type { IAccountingRepository } from './repository/interfaces';

// Core types
export type {
  AccountId,
  AccountType,
  Account,
  NewAccount,
  DefaultAccount,
  JournalEntryId,
  JournalEntry,
  NewJournalEntry,
  JournalEntryWithPostings,
  PostingId,
  PostingType,
  Posting,
  NewPosting,
  CostAllocationId,
  CostAllocation,
  NewCostAllocation,
  AllocationItemId,
  AllocationItem,
  NewAllocationItem,
  UnitId,
  Unit,
  NewUnit,
  DateRangeOptions,
  QueryOptions,
  RoundingMode,
} from './core/types';

export {
  createAccountId,
  createJournalEntryId,
  createPostingId,
  createCostAllocationId,
  createAllocationItemId,
  createUnitId,
} from './core/types';

// Money class
export { Money } from './core/decimal';

// Chart of accounts
export {
  DEFAULT_WEG_ACCOUNTS,
  getAccountsByType,
  findAccountByCode,
  getAssetAccounts,
  getLiabilityAccounts,
  getEquityAccounts,
  getIncomeAccounts,
  getExpenseAccounts,
} from './core/chart-of-accounts';

// Validation
export type { ValidationResult } from './core/validation';
export {
  validateJournalEntry,
  validateEntryBalance,
  validateAccountCode,
  validateNotFutureDate,
} from './core/validation';

// Errors
export {
  AccountingError,
  ValidationError,
  BalanceError,
  CurrencyMismatchError,
  EntityNotFoundError,
  AllocationError,
} from './core/errors';

export type { ValidationErrorDetail } from './core/errors';

// Repository interfaces
export type {
  IAccountRepository,
  IJournalRepository,
  IPostingRepository,
  IAllocationRepository,
  IUnitRepository,
  IAccountingRepository,
} from './repository/interfaces';

export { createSqliteRepository } from './repository/sqlite';

// Services
export type { JournalService } from './operations/journal';
export { createJournalService } from './operations/journal';

export type { LedgerService, LedgerEntry, LedgerEntryWithBalance } from './operations/ledger';
export { createLedgerService } from './operations/ledger';

export type {
  TrialBalanceService,
  TrialBalance,
  TrialBalanceRow,
} from './operations/trial-balance';
export { createTrialBalanceService } from './operations/trial-balance';

// Allocation
export type {
  AllocationService,
  AllocationStrategy,
  AllocationOptions,
  AllocationResult,
  AllocationResultItem,
  UnitAllocationInput,
} from './operations/allocation';

export {
  createAllocationService,
  ByShareAllocation,
  ByUsageAllocation,
  FlatAllocation,
  SpecificUnitsAllocation,
} from './operations/allocation';

/**
 * Factory function to create all accounting services at once
 */
export function createAccountingServices(db: Database): {
  repository: IAccountingRepository;
  journal: JournalService;
  ledger: LedgerService;
  trialBalance: TrialBalanceService;
  allocation: AllocationService;
} {
  const repository = createSqliteRepository(db);

  return {
    repository,
    journal: createJournalService(repository),
    ledger: createLedgerService(repository),
    trialBalance: createTrialBalanceService(repository),
    allocation: createAllocationService(repository),
  };
}

/**
 * Initialize the chart of accounts in the database
 */
export async function initializeChartOfAccounts(
  repository: IAccountingRepository
): Promise<void> {
  const { DEFAULT_WEG_ACCOUNTS } = await import('./core/chart-of-accounts');

  for (const defaultAccount of DEFAULT_WEG_ACCOUNTS) {
    const existing = await repository.accounts.findByCode(defaultAccount.code);

    if (!existing) {
      await repository.accounts.save({
        code: defaultAccount.code,
        name: defaultAccount.name,
        type: defaultAccount.type,
        isActive: true,
      });
    }
  }
}
