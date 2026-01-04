import type { IAccountingRepository } from '../repository/interfaces';
import type { Account } from '../core/types';
import { Money } from '../core/decimal';
import { createLedgerService } from './ledger';

/**
 * Trial balance row for a single account
 */
export interface TrialBalanceRow {
  account: Account;
  debitBalance?: Money;
  creditBalance?: Money;
}

/**
 * Complete trial balance report
 */
export interface TrialBalance {
  asOf: Date;
  accounts: TrialBalanceRow[];
  totalDebits: Money;
  totalCredits: Money;
  isBalanced: boolean;
}

/**
 * Service for trial balance operations
 */
export interface TrialBalanceService {
  /**
   * Generate a trial balance as of a specific date
   */
  generate(asOf: Date): Promise<TrialBalance>;
}

/**
 * Create a trial balance service instance
 */
export function createTrialBalanceService(repo: IAccountingRepository): TrialBalanceService {
  const ledgerService = createLedgerService(repo);

  return {
    async generate(asOf: Date): Promise<TrialBalance> {
      const accounts = await repo.accounts.findActive();
      const rows: TrialBalanceRow[] = [];

      let totalDebits = Money.zero();
      let totalCredits = Money.zero();

      for (const account of accounts) {
        const balance = await ledgerService.getBalance(account.id, asOf);

        // Skip accounts with zero balance
        if (balance.isZero()) {
          continue;
        }

        let debitBalance: Money | undefined;
        let creditBalance: Money | undefined;

        // Assets and Expenses normally have debit balances
        const isDebitNormal = account.type === 'asset' || account.type === 'expense';

        if (balance.isPositive()) {
          if (isDebitNormal) {
            debitBalance = balance;
            totalDebits = totalDebits.add(balance);
          } else {
            creditBalance = balance;
            totalCredits = totalCredits.add(balance);
          }
        } else {
          // Negative balance
          const absoluteBalance = balance.abs();
          if (isDebitNormal) {
            creditBalance = absoluteBalance;
            totalCredits = totalCredits.add(absoluteBalance);
          } else {
            debitBalance = absoluteBalance;
            totalDebits = totalDebits.add(absoluteBalance);
          }
        }

        rows.push({
          account,
          debitBalance,
          creditBalance,
        });
      }

      // Sort by account code
      rows.sort((a, b) => a.account.code.localeCompare(b.account.code));

      return {
        asOf,
        accounts: rows,
        totalDebits,
        totalCredits,
        isBalanced: totalDebits.equals(totalCredits),
      };
    },
  };
}
