import { Money } from '../../core/decimal';
import type { ValidationResult } from '../../core/validation';
import type {
  AllocationOptions,
  AllocationResult,
  AllocationResultItem,
  AllocationStrategy,
  UnitAllocationInput,
} from './strategy';

/**
 * SpecificUnitsAllocation - Assigns specific amounts to specific units
 *
 * Requires customAmount to be set for each unit
 * Validates that sum of custom amounts equals total
 */
export class SpecificUnitsAllocation implements AllocationStrategy {
  readonly type = 'specific_units';
  readonly name = 'Specific Unit Amounts';
  readonly description = 'Assigns specific predefined amounts to each unit';

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
      if (!unit.customAmount) {
        errors.push({
          field: 'customAmount',
          message: `Unit ${unit.unitIdentifier} is missing custom amount`,
          code: 'MISSING_CUSTOM_AMOUNT',
        });
      } else if (unit.customAmount.isNegative()) {
        errors.push({
          field: 'customAmount',
          message: `Unit ${unit.unitIdentifier} has negative custom amount`,
          code: 'NEGATIVE_CUSTOM_AMOUNT',
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
    const validationResult = this.validate(units);
    if (!validationResult.valid) {
      throw new Error(
        `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }

    const items: AllocationResultItem[] = [];
    let allocatedTotal = Money.zero(amount.currency);

    for (const unit of units) {
      if (!unit.customAmount) {
        throw new Error(`Unit ${unit.unitIdentifier} is missing custom amount`);
      }

      items.push({
        unitId: unit.unitId,
        unitIdentifier: unit.unitIdentifier,
        allocatedAmount: unit.customAmount,
      });

      allocatedTotal = allocatedTotal.add(unit.customAmount);
    }

    // Verify that the sum equals the total amount
    if (!allocatedTotal.equals(amount)) {
      throw new Error(
        `Sum of custom amounts (${allocatedTotal.toString()}) does not equal total amount (${amount.toString()})`
      );
    }

    return {
      totalAmount: amount,
      items,
      remainder: Money.zero(amount.currency),
    };
  }
}
