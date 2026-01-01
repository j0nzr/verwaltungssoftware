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
 * ByUsageAllocation - Distributes costs proportionally to usage values
 * (e.g., water consumption in m³, heating units)
 *
 * Each unit's share = (unit_usage / total_usage) × total_amount
 */
export class ByUsageAllocation implements AllocationStrategy {
  readonly type = 'by_usage';
  readonly name = 'By Usage';
  readonly description =
    'Distributes costs proportionally to usage values (e.g., water, heating)';

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

    for (const unit of units) {
      if (unit.usageValue === undefined || unit.usageValue === null) {
        errors.push({
          field: 'usageValue',
          message: `Unit ${unit.unitIdentifier} is missing usage value`,
          code: 'MISSING_USAGE_VALUE',
        });
      } else if (unit.usageValue < 0) {
        errors.push({
          field: 'usageValue',
          message: `Unit ${unit.unitIdentifier} has negative usage value: ${unit.usageValue}`,
          code: 'NEGATIVE_USAGE_VALUE',
        });
      }
    }

    const totalUsage = units.reduce((sum, unit) => sum + (unit.usageValue || 0), 0);

    if (totalUsage <= 0) {
      errors.push({
        field: 'usageValue',
        message: 'Total usage must be greater than zero',
        code: 'INVALID_TOTAL_USAGE',
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

    const totalUsage = units.reduce((sum, unit) => sum + (unit.usageValue || 0), 0);
    const items: AllocationResultItem[] = [];

    let allocatedTotal = Money.zero(amount.currency);

    for (const unit of units) {
      const usageRatio = (unit.usageValue || 0) / totalUsage;
      const allocatedAmount = amount
        .multiply(usageRatio)
        .toDecimalPlaces(options?.roundingPrecision || 2, RoundingMode.ROUND_DOWN);

      items.push({
        unitId: unit.unitId,
        unitIdentifier: unit.unitIdentifier,
        usageValue: unit.usageValue,
        allocatedAmount,
      });

      allocatedTotal = allocatedTotal.add(allocatedAmount);
    }

    // Handle remainder
    let remainder = amount.subtract(allocatedTotal);

    if (!remainder.isZero()) {
      let targetIndex = 0;

      if (options?.applyRemainderTo === 'largest') {
        targetIndex = items.reduce(
          (maxIdx, item, idx, arr) =>
            (item.usageValue || 0) > (arr[maxIdx].usageValue || 0) ? idx : maxIdx,
          0
        );
      } else if (options?.applyRemainderTo && options.applyRemainderTo !== 'first') {
        const idx = items.findIndex(item => item.unitId === options.applyRemainderTo);
        if (idx !== -1) {
          targetIndex = idx;
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
