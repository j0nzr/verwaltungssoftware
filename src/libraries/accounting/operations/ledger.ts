import type { IAccountingRepository } from '../repository/interfaces';
import type { AccountId, AccountType, DateRangeOptions, JournalEntryId } from '../core/types';
import { Money } from '../core/decimal';

/**
 * Ledger entry representing a single posting with context
 */
export interface LedgerEntry {
  date: Date;
  description: string;
  reference?: string;
  debit?: Money;
  credit?: Money;
  journalEntryId: JournalEntryId;
  memo?: string;
}

/**
 * Ledger entry with running balance
 */
export interface LedgerEntryWithBalance extends LedgerEntry {
  balance: Money;
}

/**
 * Service for ledger operations
 */
export interface LedgerService {
  /**
   * Get account balance as of a specific date
   */
  getBalance(accountId: AccountId, asOf?: Date): Promise<Money>;

  /**
   * Get all postings for an account (account ledger)
   */
  getAccountLedger(
    accountId: AccountId,
    options?: DateRangeOptions
  ): Promise<LedgerEntry[]>;

  /**
   * Get ledger with running balance for each posting
   */
  getAccountLedgerWithRunningBalance(
    accountId: AccountId,
    options?: DateRangeOptions
  ): Promise<LedgerEntryWithBalance[]>;
}

/**
 * Create a ledger service instance
 */
export function createLedgerService(repo: IAccountingRepository): LedgerService {
  /**
   * Calculate the effect of a posting on account balance
   * Assets & Expenses: Debits increase, Credits decrease
   * Liabilities, Equity & Income: Credits increase, Debits decrease
   */
  function calculateBalanceEffect(
    accountType: AccountType,
    debit: Money | undefined,
    credit: Money | undefined
  ): Money {
    const isDebitNormal = accountType === 'asset' || accountType === 'expense';

    if (debit && !credit) {
      return isDebitNormal ? debit : debit.negate();
    } else if (credit && !debit) {
      return isDebitNormal ? credit.negate() : credit;
    }

    return Money.zero();
  }

  return {
    async getBalance(accountId: AccountId, asOf?: Date): Promise<Money> {
      const account = await repo.accounts.findById(accountId);
      if (!account) {
        throw new Error(`Account not found: ${accountId}`);
      }

      const options: DateRangeOptions = asOf ? { endDate: asOf } : {};
      const postings = await repo.postings.findByAccount(accountId, options);

      let balance = Money.zero();

      for (const posting of postings) {
        const amount = Money.of(posting.amount);
        const debit = posting.type === 'debit' ? amount : undefined;
        const credit = posting.type === 'credit' ? amount : undefined;

        const effect = calculateBalanceEffect(account.type, debit, credit);
        balance = balance.add(effect);
      }

      return balance;
    },

    async getAccountLedger(
      accountId: AccountId,
      options?: DateRangeOptions
    ): Promise<LedgerEntry[]> {
      const postings = await repo.postings.findByAccount(accountId, options);

      const ledgerEntries: LedgerEntry[] = [];

      for (const posting of postings) {
        const journalEntry = await repo.journal.findById(posting.journalEntryId);
        if (!journalEntry) {
          continue;
        }

        const amount = Money.of(posting.amount);

        ledgerEntries.push({
          date: journalEntry.date,
          description: journalEntry.description,
          reference: journalEntry.reference,
          debit: posting.type === 'debit' ? amount : undefined,
          credit: posting.type === 'credit' ? amount : undefined,
          journalEntryId: posting.journalEntryId,
          memo: posting.memo,
        });
      }

      return ledgerEntries;
    },

    async getAccountLedgerWithRunningBalance(
      accountId: AccountId,
      options?: DateRangeOptions
    ): Promise<LedgerEntryWithBalance[]> {
      const account = await repo.accounts.findById(accountId);
      if (!account) {
        throw new Error(`Account not found: ${accountId}`);
      }

      const ledgerEntries = await this.getAccountLedger(accountId, options);

      let runningBalance = Money.zero();
      const entriesWithBalance: LedgerEntryWithBalance[] = [];

      for (const entry of ledgerEntries) {
        const effect = calculateBalanceEffect(account.type, entry.debit, entry.credit);
        runningBalance = runningBalance.add(effect);

        entriesWithBalance.push({
          ...entry,
          balance: runningBalance,
        });
      }

      return entriesWithBalance;
    },
  };
}
