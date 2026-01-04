// Base accounting error
export class AccountingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AccountingError';
    Object.setPrototypeOf(this, AccountingError.prototype);
  }
}

// Validation error with detailed error list
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export class ValidationError extends AccountingError {
  constructor(message: string, public errors: ValidationErrorDetail[]) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Entry balance error (debits != credits)
export class BalanceError extends AccountingError {
  constructor(public debits: string, public credits: string) {
    super(
      `Entry does not balance: debits=${debits}, credits=${credits}`,
      'BALANCE_ERROR'
    );
    this.name = 'BalanceError';
    Object.setPrototypeOf(this, BalanceError.prototype);
  }
}

// Currency mismatch error
export class CurrencyMismatchError extends AccountingError {
  constructor(public expected: string, public actual: string) {
    super(
      `Currency mismatch: expected ${expected}, got ${actual}`,
      'CURRENCY_MISMATCH'
    );
    this.name = 'CurrencyMismatchError';
    Object.setPrototypeOf(this, CurrencyMismatchError.prototype);
  }
}

// Entity not found error
export class EntityNotFoundError extends AccountingError {
  constructor(public entityType: string, public entityId: string) {
    super(`${entityType} not found: ${entityId}`, 'NOT_FOUND');
    this.name = 'EntityNotFoundError';
    Object.setPrototypeOf(this, EntityNotFoundError.prototype);
  }
}

// Allocation error
export class AllocationError extends AccountingError {
  constructor(message: string) {
    super(message, 'ALLOCATION_ERROR');
    this.name = 'AllocationError';
    Object.setPrototypeOf(this, AllocationError.prototype);
  }
}
