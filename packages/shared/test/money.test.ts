import { test, expect } from "bun:test";
import { Money } from "../src/index";

test("Money.of stores the amount in minor units and its currency", () => {
  const m = Money.of(1500, "USD");
  expect(m.amount).toBe(1500);
  expect(m.currency).toBe("USD");
});
