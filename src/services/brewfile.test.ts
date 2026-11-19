import { describe, expect, test } from "bun:test";
import { formatTimestamp } from "./brewfile";

describe("formatTimestamp", () => {
  test("zero pads single digit fields", () => {
    expect(formatTimestamp(new Date(2026, 0, 5, 3, 4, 9))).toBe(
      "2026-01-05 03:04:09",
    );
  });

  test("uses a 24 hour clock", () => {
    expect(formatTimestamp(new Date(2026, 11, 31, 23, 59, 59))).toBe(
      "2026-12-31 23:59:59",
    );
  });
});
