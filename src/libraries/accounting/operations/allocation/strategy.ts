import type { UnitId } from '../../core/types';
import { Money } from '../../core/decimal';
import type { ValidationResult } from '../../core/validation';

/**
 * Input for a single unit in allocation calculation
 */
export interface UnitAllocationInput {
  unitId: UnitId;
  unitIdentifier: string;
  ownershipShares: number;
  usageValue?: number; // For usage-based allocation
  customAmount?: Money; // For specific unit allocation
}

/**
 * Result item for a single unit's allocation
 */
export interface AllocationResultItem {
  unitId: UnitId;
  unitIdentifier: string;
  shareValue?: number;
  usageValue?: number;
  allocatedAmount: Money;
}

/**
 * Complete allocation result
 */
export interface AllocationResult {
  totalAmount: Money;
  items: AllocationResultItem[];
  remainder: Money; // Rounding remainder
  appliedRemainderTo?: UnitId; // Which unit received the remainder
}

/**
 * Options for allocation calculation
 */
export interface AllocationOptions {
  roundingPrecision?: number; // Decimal places for rounding (default: 2)
  applyRemainderTo?: 'largest' | 'first' | UnitId; // How to handle rounding remainder
}

/**
 * Base interface for all allocation strategies
 */
export interface AllocationStrategy {
  /**
   * Unique type identifier for this strategy
   */
  readonly type: string;

  /**
   * Human-readable name for this strategy
   */
  readonly name: string;

  /**
   * Description of how this strategy works
   */
  readonly description: string;

  /**
   * Calculate allocation for each unit
   */
  calculate(
    amount: Money,
    units: UnitAllocationInput[],
    options?: AllocationOptions
  ): AllocationResult;

  /**
   * Validate inputs for this strategy
   */
  validate(units: UnitAllocationInput[]): ValidationResult;
}
