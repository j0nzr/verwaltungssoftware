import Decimal from 'decimal.js';
import { CurrencyMismatchError } from './errors';
import { RoundingMode } from './types';

// Configure Decimal.js defaults
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Immutable Money class wrapping Decimal.js for precise financial calculations.
 * All operations return new Money instances.
 */
export class Money {
  private constructor(
    private readonly value: Decimal,
    private readonly _currency: string = 'EUR'
  ) {}

  /**
   * Create a Money instance from a number or string
   */
  static of(amount: string | number, currency: string = 'EUR'): Money {
    return new Money(new Decimal(amount), currency.toUpperCase());
  }

  /**
   * Create a Money instance with zero value
   */
  static zero(currency: string = 'EUR'): Money {
    return new Money(new Decimal(0), currency.toUpperCase());
  }

  /**
   * Sum an array of Money values
   * All values must have the same currency
   */
  static sum(amounts: Money[]): Money {
    if (amounts.length === 0) {
      return Money.zero();
    }

    const currency = amounts[0]._currency;
    const sum = amounts.reduce((acc, amount) => {
      if (amount._currency !== currency) {
        throw new CurrencyMismatchError(currency, amount._currency);
      }
      return acc.add(amount.value);
    }, new Decimal(0));

    return new Money(sum, currency);
  }

  /**
   * Get the currency code
   */
  get currency(): string {
    return this._currency;
  }

  /**
   * Add another Money value
   */
  add(other: Money): Money {
    this.checkCurrency(other);
    return new Money(this.value.add(other.value), this._currency);
  }

  /**
   * Subtract another Money value
   */
  subtract(other: Money): Money {
    this.checkCurrency(other);
    return new Money(this.value.sub(other.value), this._currency);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number | string): Money {
    return new Money(this.value.mul(factor), this._currency);
  }

  /**
   * Divide by a divisor
   */
  divide(divisor: number | string, roundingMode?: RoundingMode): Money {
    const mode = roundingMode !== undefined ? roundingMode : Decimal.ROUND_HALF_UP;
    const result = this.value.div(divisor);

    return new Money(
      new Decimal(result.toFixed(this.getDecimalPlaces(), mode)),
      this._currency
    );
  }

  /**
   * Get absolute value
   */
  abs(): Money {
    return new Money(this.value.abs(), this._currency);
  }

  /**
   * Negate the value
   */
  negate(): Money {
    return new Money(this.value.neg(), this._currency);
  }

  /**
   * Check if value is zero
   */
  isZero(): boolean {
    return this.value.isZero();
  }

  /**
   * Check if value is positive
   */
  isPositive(): boolean {
    return this.value.isPositive();
  }

  /**
   * Check if value is negative
   */
  isNegative(): boolean {
    return this.value.isNegative();
  }

  /**
   * Check equality with another Money value
   */
  equals(other: Money): boolean {
    return this._currency === other._currency && this.value.equals(other.value);
  }

  /**
   * Check if greater than another Money value
   */
  greaterThan(other: Money): boolean {
    this.checkCurrency(other);
    return this.value.greaterThan(other.value);
  }

  /**
   * Check if less than another Money value
   */
  lessThan(other: Money): boolean {
    this.checkCurrency(other);
    return this.value.lessThan(other.value);
  }

  /**
   * Round to specified decimal places
   */
  toDecimalPlaces(places: number, roundingMode?: RoundingMode): Money {
    const mode = roundingMode !== undefined ? roundingMode : Decimal.ROUND_HALF_UP;
    return new Money(
      new Decimal(this.value.toFixed(places, mode)),
      this._currency
    );
  }

  /**
   * Convert to string representation (preserves precision)
   */
  toString(): string {
    return this.value.toFixed(this.getDecimalPlaces());
  }

  /**
   * Convert to number (use with caution - may lose precision)
   */
  toNumber(): number {
    return this.value.toNumber();
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON(): { amount: string; currency: string } {
    return {
      amount: this.toString(),
      currency: this._currency,
    };
  }

  /**
   * Format for display with currency symbol
   */
  format(): string {
    const formatted = this.value.toFixed(this.getDecimalPlaces());
    return `${formatted} ${this._currency}`;
  }

  /**
   * Get decimal places for the currency (default 2)
   */
  private getDecimalPlaces(): number {
    // Most currencies use 2 decimal places
    // Could be extended to handle special cases (JPY, BHD, etc.)
    return 2;
  }

  /**
   * Check currency compatibility
   */
  private checkCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new CurrencyMismatchError(this._currency, other._currency);
    }
  }
}
