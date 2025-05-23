export type Config = {
  brewfile: string;
  machines: {
    [section: string]: {
      taps?: readonly string[];
      formulae?: readonly string[];
      casks?: readonly string[];
    };
  };
  metadata?: {
    path: string;
    version: string;
  };
};
