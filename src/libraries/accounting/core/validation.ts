import { Money } from './decimal';
import { NewJournalEntry, NewPosting } from './types';
import type { ValidationErrorDetail } from './errors';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorDetail[];
}

/**
 * Validates that debits equal credits in a journal entry
 */
export function validateEntryBalance(postings: NewPosting[]): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (!postings || postings.length === 0) {
    errors.push({
      field: 'postings',
      message: 'At least one posting is required',
      code: 'EMPTY_POSTINGS',
    });
    return { valid: false, errors };
  }

  if (postings.length < 2) {
    errors.push({
      field: 'postings',
      message: 'At least two postings (one debit and one credit) are required',
      code: 'INSUFFICIENT_POSTINGS',
    });
    return { valid: false, errors };
  }

  // Calculate total debits and credits
  let totalDebits = Money.zero();
  let totalCredits = Money.zero();

  for (const posting of postings) {
    try {
      const amount = Money.of(posting.amount);

      if (amount.isNegative()) {
        errors.push({
          field: 'amount',
          message: `Posting amount cannot be negative: ${posting.amount}`,
          code: 'NEGATIVE_AMOUNT',
        });
        continue;
      }

      if (posting.type === 'debit') {
        totalDebits = totalDebits.add(amount);
      } else if (posting.type === 'credit') {
        totalCredits = totalCredits.add(amount);
      } else {
        errors.push({
          field: 'type',
          message: `Invalid posting type: ${posting.type}`,
          code: 'INVALID_TYPE',
        });
      }
    } catch (error) {
      errors.push({
        field: 'amount',
        message: `Invalid amount format: ${posting.amount}`,
        code: 'INVALID_AMOUNT',
      });
    }
  }

  // Check if debits equal credits
  if (!totalDebits.equals(totalCredits)) {
    errors.push({
      field: 'balance',
      message: `Entry does not balance: debits=${totalDebits.toString()}, credits=${totalCredits.toString()}`,
      code: 'UNBALANCED_ENTRY',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates account code format
 * German SKR 04 typically uses 4-digit codes
 */
export function validateAccountCode(code: string): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (!code || code.trim() === '') {
    errors.push({
      field: 'code',
      message: 'Account code is required',
      code: 'EMPTY_CODE',
    });
    return { valid: false, errors };
  }

  // Check if code is numeric and 4 digits
  if (!/^\d{4}$/.test(code)) {
    errors.push({
      field: 'code',
      message: 'Account code must be a 4-digit number',
      code: 'INVALID_CODE_FORMAT',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a complete journal entry before saving
 */
export function validateJournalEntry(
  entry: NewJournalEntry,
  postings: NewPosting[]
): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  // Validate entry fields
  if (!entry.description || entry.description.trim() === '') {
    errors.push({
      field: 'description',
      message: 'Description is required',
      code: 'EMPTY_DESCRIPTION',
    });
  }

  if (!entry.date) {
    errors.push({
      field: 'date',
      message: 'Date is required',
      code: 'EMPTY_DATE',
    });
  }

  if (!entry.createdBy || entry.createdBy.trim() === '') {
    errors.push({
      field: 'createdBy',
      message: 'Creator identifier is required',
      code: 'EMPTY_CREATOR',
    });
  }

  // Validate postings balance
  const balanceResult = validateEntryBalance(postings);
  errors.push(...balanceResult.errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a date is not in the future
 */
export function validateNotFutureDate(date: Date): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (date > new Date()) {
    errors.push({
      field: 'date',
      message: 'Date cannot be in the future',
      code: 'FUTURE_DATE',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
