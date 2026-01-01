import { Money } from '../../core/decimal';
import { RoundingMode } from '../../core/types';
import type { ValidationResult } from '../../core/validation';
import type {
  AllocationOptions,
  AllocationResult,
  AllocationResultItem,
  AllocationStrategy,
  UnitAllocationInput,
} from './strategy';

/**
 * ByShareAllocation - Distributes costs proportionally to ownership shares
 * (Miteigentumsanteil)
 *
 * Each unit's share = (unit_shares / total_shares) × total_amount
 * Handles rounding remainder by assigning to largest shareholder (or as specified in options)
 */
export class ByShareAllocation implements AllocationStrategy {
  readonly type = 'by_share';
  readonly name = 'By Ownership Share';
  readonly description =
    'Distributes costs proportionally to ownership shares (Miteigentumsanteil)';

  validate(units: UnitAllocationInput[]): ValidationResult {
    const errors: any[] = [];

    if (!units || units.length === 0) {
      errors.push({
        field: 'units',
        message: 'At least one unit is required',
        code: 'EMPTY_UNITS',
      });
      return { valid: false, errors };
    }

    const totalShares = units.reduce((sum, unit) => sum + unit.ownershipShares, 0);

    if (totalShares <= 0) {
      errors.push({
        field: 'ownershipShares',
        message: 'Total ownership shares must be greater than zero',
        code: 'INVALID_TOTAL_SHARES',
      });
    }

    for (const unit of units) {
      if (unit.ownershipShares <= 0) {
        errors.push({
          field: 'ownershipShares',
          message: `Unit ${unit.unitIdentifier} has invalid ownership shares: ${unit.ownershipShares}`,
          code: 'INVALID_SHARES',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  calculate(
    amount: Money,
    units: UnitAllocationInput[],
    options?: AllocationOptions
  ): AllocationResult {
    // Validate inputs
    const validationResult = this.validate(units);
    if (!validationResult.valid) {
      throw new Error(
        `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }

    const totalShares = units.reduce((sum, unit) => sum + unit.ownershipShares, 0);
    const items: AllocationResultItem[] = [];

    let allocatedTotal = Money.zero(amount.currency);

    // Calculate allocation for each unit
    for (const unit of units) {
      const shareRatio = unit.ownershipShares / totalShares;
      const allocatedAmount = amount
        .multiply(shareRatio)
        .toDecimalPlaces(options?.roundingPrecision || 2, RoundingMode.ROUND_DOWN);

      items.push({
        unitId: unit.unitId,
        unitIdentifier: unit.unitIdentifier,
        shareValue: unit.ownershipShares,
        allocatedAmount,
      });

      allocatedTotal = allocatedTotal.add(allocatedAmount);
    }

    // Calculate remainder
    let remainder = amount.subtract(allocatedTotal);

    // Apply remainder to specified unit
    if (!remainder.isZero()) {
      let targetIndex = 0;

      if (options?.applyRemainderTo === 'largest') {
        // Find unit with largest ownership share
        targetIndex = items.reduce(
          (maxIdx, item, idx, arr) =>
            (item.shareValue || 0) > (arr[maxIdx].shareValue || 0) ? idx : maxIdx,
          0
        );
      } else if (options?.applyRemainderTo && options.applyRemainderTo !== 'first') {
        // Find specific unit by ID
        const idx = items.findIndex(item => item.unitId === options.applyRemainderTo);
        if (idx !== -1) {
          targetIndex = idx;
        }
      }
      // Otherwise use 'first' (default)

      items[targetIndex].allocatedAmount = items[targetIndex].allocatedAmount.add(remainder);

      return {
        totalAmount: amount,
        items,
        remainder: Money.zero(amount.currency),
        appliedRemainderTo: items[targetIndex].unitId,
      };
    }

    return {
      totalAmount: amount,
      items,
      remainder: Money.zero(amount.currency),
    };
  }
}
