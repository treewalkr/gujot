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
