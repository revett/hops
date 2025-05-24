export type Machine = {
  readonly taps?: readonly string[];
  readonly formulae?: readonly string[];
  readonly casks?: readonly string[];
};

export type Config = {
  readonly brewfile: string;
  readonly machines: Record<string, Machine>;
  metadata?: {
    readonly path: string;
    readonly version: string;
  };
};
