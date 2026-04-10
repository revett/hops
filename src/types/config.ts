export type Npm = {
  readonly version: string;
  readonly packages: readonly string[];
};

export type Machine = {
  readonly taps?: readonly string[];
  readonly formulae?: readonly string[];
  readonly casks?: readonly string[];
  readonly cursor?: readonly string[];
  readonly npm?: Npm;
};

export type Config = {
  readonly brewfile: string;
  readonly machines: Record<string, Machine>;
  readonly reminder?: number;
};
