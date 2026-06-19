// @gujot/shared — Money/Currency primitives (ADR-0003).
//
// Money is stored as integer minor units (cents) to avoid floating-point
// error. It is a value object: two Money values are equal iff their amount
// and currency match. Currency is a curated set of ISO 4217 codes.

/** ISO 4217 codes this system currently understands. */
export const CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * An amount of money in a specific currency, held as integer minor units.
 * Construct via `Money.of`; the constructor is private so instances are
 * always created through the factory.
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency,
  ) {}

  /** Create a Money value from an amount in minor units (e.g. 1500 → $15.00). */
  static of(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }

  /** Create from a major-unit decimal (e.g. 15.05 dollars → 1505 minor units). */
  static fromDecimal(major: number, currency: Currency): Money {
    return new Money(Math.round(major * 100), currency);
  }

  /** Sum two same-currency amounts; throws if currencies differ. */
  add(other: Money): Money {
    assertSameCurrency(this, other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /** Subtract a same-currency amount; throws if currencies differ. */
  subtract(other: Money): Money {
    assertSameCurrency(this, other);
    return new Money(this.amount - other.amount, this.currency);
  }

  /** Value equality: true iff amount and currency both match. */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /** Render as a localized currency string (minor units → major units). */
  format(): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currency,
    }).format(this.amount / 100);
  }
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(
      `currency mismatch: ${a.currency} vs ${b.currency}`,
    );
  }
}
