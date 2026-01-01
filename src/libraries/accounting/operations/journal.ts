import type { IAccountingRepository } from '../repository/interfaces';
import type { JournalEntry, JournalEntryId, JournalEntryWithPostings, NewJournalEntry, NewPosting } from '../core/types';
import { validateJournalEntry } from '../core/validation';
import { ValidationError } from '../core/errors';

/**
 * Service for journal entry operations
 */
export interface JournalService {
  /**
   * Create a new journal entry with postings
   */
  createEntry(entry: NewJournalEntry, postings: NewPosting[]): Promise<JournalEntry>;

  /**
   * Create a reversal entry (for corrections - never delete in accounting)
   */
  reverseEntry(
    entryId: JournalEntryId,
    reason: string,
    date?: Date,
    createdBy?: string
  ): Promise<JournalEntry>;

  /**
   * Get entry with all postings loaded
   */
  getEntryWithPostings(id: JournalEntryId): Promise<JournalEntryWithPostings | null>;
}

/**
 * Create a journal service instance
 */
export function createJournalService(repo: IAccountingRepository): JournalService {
  return {
    async createEntry(entry: NewJournalEntry, postings: NewPosting[]): Promise<JournalEntry> {
      // Validate the entry
      const validationResult = validateJournalEntry(entry, postings);
      if (!validationResult.valid) {
        throw new ValidationError(
          'Journal entry validation failed',
          validationResult.errors
        );
      }

      // Use transaction to ensure atomicity
      return await repo.transaction(async () => {
        // Save the journal entry
        const savedEntry = await repo.journal.save(entry);

        // Save all postings
        await repo.postings.saveAll(savedEntry.id, postings);

        return savedEntry;
      });
    },

    async reverseEntry(
      entryId: JournalEntryId,
      reason: string,
      date?: Date,
      createdBy?: string
    ): Promise<JournalEntry> {
      return await repo.transaction(async () => {
        // Get the original entry
        const originalEntry = await repo.journal.findById(entryId);
        if (!originalEntry) {
          throw new Error(`Journal entry not found: ${entryId}`);
        }

        // Get the original postings
        const originalPostings = await repo.postings.findByJournalEntry(entryId);

        // Create reversal postings (swap debit/credit)
        const reversalPostings: NewPosting[] = originalPostings.map(posting => ({
          accountId: posting.accountId,
          amount: posting.amount,
          type: posting.type === 'debit' ? 'credit' : 'debit',
          memo: `Reversal of ${originalEntry.reference || originalEntry.id}`,
        }));

        // Create the reversal entry
        const reversalEntry: NewJournalEntry = {
          date: date || new Date(),
          description: `REVERSAL: ${reason}`,
          reference: `REV-${originalEntry.reference || originalEntry.id}`,
          createdBy: createdBy || originalEntry.createdBy,
        };

        // Save the reversal entry and postings
        const savedReversalEntry = await repo.journal.save(reversalEntry);
        await repo.postings.saveAll(savedReversalEntry.id, reversalPostings);

        // Mark the original entry as reversed
        await repo.journal.markReversed(entryId, savedReversalEntry.id);

        return savedReversalEntry;
      });
    },

    async getEntryWithPostings(id: JournalEntryId): Promise<JournalEntryWithPostings | null> {
      const entry = await repo.journal.findById(id);
      if (!entry) {
        return null;
      }

      const postings = await repo.postings.findByJournalEntry(id);

      return {
        ...entry,
        postings,
      };
    },
  };
}
