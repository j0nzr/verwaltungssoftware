import type { IAccountingRepository } from '../../repository/interfaces';
import type { AccountId, JournalEntry, NewAllocationItem, NewCostAllocation, NewJournalEntry, NewPosting } from '../../core/types';
import { Money } from '../../core/decimal';
import { AllocationError } from '../../core/errors';
import type { AllocationOptions, AllocationResult, AllocationStrategy, UnitAllocationInput } from './strategy';
import { ByShareAllocation } from './by-share';
import { ByUsageAllocation } from './by-usage';
import { FlatAllocation } from './flat';
import { SpecificUnitsAllocation } from './specific-units';

/**
 * Service for cost allocation operations
 */
export interface AllocationService {
  /**
   * Register a new allocation strategy
   */
  registerStrategy(strategy: AllocationStrategy): void;

  /**
   * Get all available strategies
   */
  getAvailableStrategies(): AllocationStrategy[];

  /**
   * Get a specific strategy by type
   */
  getStrategy(type: string): AllocationStrategy | undefined;

  /**
   * Calculate allocation using specified strategy
   */
  calculate(
    strategyType: string,
    amount: Money,
    units: UnitAllocationInput[],
    options?: AllocationOptions
  ): AllocationResult;

  /**
   * Create and save allocation with journal entry
   */
  createAllocationEntry(
    strategyType: string,
    amount: Money,
    units: UnitAllocationInput[],
    expenseAccountId: AccountId,
    receivableAccountId: AccountId,
    description: string,
    date: Date,
    createdBy: string,
    reference?: string
  ): Promise<JournalEntry>;
}

/**
 * Create an allocation service instance
 */
export function createAllocationService(repo: IAccountingRepository): AllocationService {
  const strategies = new Map<string, AllocationStrategy>();

  // Register built-in strategies
  const builtInStrategies = [
    new ByShareAllocation(),
    new ByUsageAllocation(),
    new FlatAllocation(),
    new SpecificUnitsAllocation(),
  ];

  builtInStrategies.forEach(strategy => {
    strategies.set(strategy.type, strategy);
  });

  return {
    registerStrategy(strategy: AllocationStrategy): void {
      strategies.set(strategy.type, strategy);
    },

    getAvailableStrategies(): AllocationStrategy[] {
      return Array.from(strategies.values());
    },

    getStrategy(type: string): AllocationStrategy | undefined {
      return strategies.get(type);
    },

    calculate(
      strategyType: string,
      amount: Money,
      units: UnitAllocationInput[],
      options?: AllocationOptions
    ): AllocationResult {
      const strategy = strategies.get(strategyType);
      if (!strategy) {
        throw new AllocationError(`Unknown allocation strategy: ${strategyType}`);
      }

      return strategy.calculate(amount, units, options);
    },

    async createAllocationEntry(
      strategyType: string,
      amount: Money,
      units: UnitAllocationInput[],
      expenseAccountId: AccountId,
      receivableAccountId: AccountId,
      description: string,
      date: Date,
      createdBy: string,
      reference?: string
    ): Promise<JournalEntry> {
      const strategy = strategies.get(strategyType);
      if (!strategy) {
        throw new AllocationError(`Unknown allocation strategy: ${strategyType}`);
      }

      // Calculate allocation
      const allocationResult = strategy.calculate(amount, units);

      return await repo.transaction(async () => {
        // Create journal entry
        const journalEntryData: NewJournalEntry = {
          date,
          description,
          reference,
          createdBy,
        };

        const journalEntry = await repo.journal.save(journalEntryData);

        // Create postings:
        // Debit: Expense account (total amount)
        // Credit: Receivable account for each unit (allocated amounts)
        const postings: NewPosting[] = [
          {
            accountId: expenseAccountId,
            amount: amount.toString(),
            type: 'debit',
            memo: `Allocation using ${strategy.name}`,
          },
        ];

        // Add credit posting for each unit's receivable
        for (const item of allocationResult.items) {
          postings.push({
            accountId: receivableAccountId,
            amount: item.allocatedAmount.toString(),
            type: 'credit',
            memo: `Unit ${item.unitIdentifier}`,
          });
        }

        await repo.postings.saveAll(journalEntry.id, postings);

        // Save cost allocation record
        const allocationData: NewCostAllocation = {
          journalEntryId: journalEntry.id,
          allocationType: strategyType,
          totalAmount: amount.toString(),
          currency: amount.currency,
          metadata: {
            strategyName: strategy.name,
            description: strategy.description,
            appliedRemainderTo: allocationResult.appliedRemainderTo,
          },
        };

        const allocation = await repo.allocations.save(allocationData);

        // Save allocation items
        const allocationItems: NewAllocationItem[] = allocationResult.items.map(item => ({
          unitId: item.unitId,
          unitIdentifier: item.unitIdentifier,
          shareValue: item.shareValue?.toString(),
          usageValue: item.usageValue?.toString(),
          allocatedAmount: item.allocatedAmount.toString(),
        }));

        await repo.allocations.saveItems(allocation.id, allocationItems);

        return journalEntry;
      });
    },
  };
}
