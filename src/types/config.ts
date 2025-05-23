export type Config = {
  [section: string]: {
    taps?: string[];
    formula?: string[];
    casks?: string[];
  };
};
