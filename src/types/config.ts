export type Machine = {
  readonly taps?: readonly string[];
  readonly formulae?: readonly string[];
  readonly casks?: readonly string[];
  readonly cursor?: readonly string[];
  // Packages managed outside of hops (e.g. by an MDM), never installed,
  // upgraded, or uninstalled by hops
  readonly ignore?: readonly string[];
};

export type Config = {
  readonly brewfile: string;
  readonly machines: Record<string, Machine>;
  readonly reminder?: number;
  readonly logging?: boolean;
};
