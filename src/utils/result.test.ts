import { describe, expect, test } from "bun:test";
import { err, ok, type Result } from "./result";

const parse = (input: string): Result<number, Error> => {
  const n = Number(input);
  return Number.isNaN(n) ? err(new Error(`Not a number: ${input}`)) : ok(n);
};

describe("Result", () => {
  test("ok carries a value", () => {
    const result = parse("42");
    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    if (result.isOk()) {
      expect(result.value).toBe(42);
    }
  });

  test("err carries an error", () => {
    const result = parse("nope");
    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Not a number: nope");
    }
  });
});
