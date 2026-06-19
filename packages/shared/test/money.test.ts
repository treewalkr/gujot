import { test, expect } from "bun:test";
import { Money } from "../src/index";

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
