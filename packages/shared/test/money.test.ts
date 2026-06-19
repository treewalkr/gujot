import { test, expect } from "bun:test";
import { CURRENCIES, Money } from "../src/index";

test("Money.of stores the amount in minor units and its currency", () => {
  const m = Money.of(1500, "USD");
  expect(m.amount).toBe(1500);
  expect(m.currency).toBe("USD");
});

test("add returns the sum of two same-currency amounts", () => {
  expect(Money.of(1500, "USD").add(Money.of(2500, "USD"))).toEqual(Money.of(4000, "USD"));
});

test("add throws when the currencies differ", () => {
  expect(() => Money.of(1500, "USD").add(Money.of(2500, "EUR"))).toThrow();
});

test("subtract returns the difference of two same-currency amounts", () => {
  expect(Money.of(4000, "USD").subtract(Money.of(1500, "USD"))).toEqual(Money.of(2500, "USD"));
});

test("subtract throws when the currencies differ", () => {
  expect(() => Money.of(4000, "USD").subtract(Money.of(1500, "EUR"))).toThrow();
});

test("equals is true only when amount and currency both match", () => {
  expect(Money.of(1500, "USD").equals(Money.of(1500, "USD"))).toBe(true);
  expect(Money.of(1500, "USD").equals(Money.of(1500, "EUR"))).toBe(false);
  expect(Money.of(1500, "USD").equals(Money.of(1499, "USD"))).toBe(false);
});

test("format renders minor units as a currency string", () => {
  expect(Money.of(1500, "USD").format()).toBe("$15.00");
  expect(Money.of(0, "USD").format()).toBe("$0.00");
  expect(Money.of(-1500, "USD").format()).toBe("-$15.00");
});

test("adding zero is the identity", () => {
  expect(Money.of(1500, "USD").add(Money.of(0, "USD"))).toEqual(Money.of(1500, "USD"));
});

test("arithmetic handles negative amounts (debts)", () => {
  expect(Money.of(1500, "USD").add(Money.of(-4000, "USD"))).toEqual(Money.of(-2500, "USD"));
  expect(Money.of(-2500, "USD").subtract(Money.of(-1000, "USD"))).toEqual(Money.of(-1500, "USD"));
});

test("large minor-unit amounts stay precise within safe integers", () => {
  const big = 90071992547409; // just under Number.MAX_SAFE_INTEGER / 100
  expect(Money.of(big, "USD").add(Money.of(big, "USD"))).toEqual(Money.of(big * 2, "USD"));
});

test("fromDecimal converts major-unit decimals to minor units", () => {
  expect(Money.fromDecimal(15, "USD")).toEqual(Money.of(1500, "USD"));
  expect(Money.fromDecimal(15.5, "USD")).toEqual(Money.of(1550, "USD"));
  expect(Money.fromDecimal(15.05, "USD")).toEqual(Money.of(1505, "USD"));
  expect(Money.fromDecimal(0, "USD")).toEqual(Money.of(0, "USD"));
  expect(Money.fromDecimal(-15, "USD")).toEqual(Money.of(-1500, "USD"));
});

test("fromDecimal rounds half-cents correctly past float edges", () => {
  // 1.005 * 100 lands at 100.49999… without the EPSILON correction and would
  // wrongly round to 100; it should round half-up to 101.
  expect(Money.fromDecimal(1.005, "USD")).toEqual(Money.of(101, "USD"));
  expect(Money.fromDecimal(2.675, "USD")).toEqual(Money.of(268, "USD"));
  expect(Money.fromDecimal(10.005, "USD")).toEqual(Money.of(1001, "USD"));
});

test("supports THB as a currency", () => {
  expect(CURRENCIES).toContain("THB");
  // Intl formats THB as "THB 15.00" (non-breaking space); accept any
  // whitespace so the assertion is locale-stable.
  expect(Money.of(1500, "THB").format()).toMatch(/^THB\s+15\.00$/);
});
