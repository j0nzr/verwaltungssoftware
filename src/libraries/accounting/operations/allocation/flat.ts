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
 * FlatAllocation - Distributes costs equally among all units
 *
 * Each unit's share = total_amount / number_of_units
 */
export class FlatAllocation implements AllocationStrategy {
  readonly type = 'flat';
  readonly name = 'Flat/Equal Distribution';
  readonly description = 'Distributes costs equally among all units';

  validate(units: UnitAllocationInput[]): ValidationResult {
    const errors: any[] = [];

    if (!units || units.length === 0) {
      errors.push({
        field: 'units',
        message: 'At least one unit is required',
        code: 'EMPTY_UNITS',
      });
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
    const validationResult = this.validate(units);
    if (!validationResult.valid) {
      throw new Error(
        `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }

    const numUnits = units.length;
    const items: AllocationResultItem[] = [];

    let allocatedTotal = Money.zero(amount.currency);

    // Calculate equal share for each unit
    for (const unit of units) {
      const allocatedAmount = amount
        .divide(numUnits, RoundingMode.ROUND_DOWN)
        .toDecimalPlaces(options?.roundingPrecision || 2, RoundingMode.ROUND_DOWN);

      items.push({
        unitId: unit.unitId,
        unitIdentifier: unit.unitIdentifier,
        allocatedAmount,
      });

      allocatedTotal = allocatedTotal.add(allocatedAmount);
    }

    // Handle remainder
    let remainder = amount.subtract(allocatedTotal);

    if (!remainder.isZero()) {
      let targetIndex = 0;

      if (options?.applyRemainderTo && options.applyRemainderTo !== 'first') {
        if (options.applyRemainderTo === 'largest') {
          // For flat allocation, 'largest' defaults to first since all are equal
          targetIndex = 0;
        } else {
          const idx = items.findIndex(item => item.unitId === options.applyRemainderTo);
          if (idx !== -1) {
            targetIndex = idx;
          }
        }
      }

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
