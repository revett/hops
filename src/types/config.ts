export type Machine = {
  readonly taps?: readonly string[];
  readonly formulae?: readonly string[];
  readonly casks?: readonly string[];
  readonly cursor?: readonly string[];
};

export type Config = {
  readonly brewfile: string;
  readonly machines: Record<string, Machine>;
};
