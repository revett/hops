import type { Result } from "neverthrow";

export type CommandOption = {
  readonly flags: string;
  readonly description: string;
};

export type Command<T = Record<string, unknown>> = {
  readonly name: string;
  readonly description: string;
  readonly options?: readonly CommandOption[];
  readonly action: (options: T) => Promise<Result<void, Error>>;
};
