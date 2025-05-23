export type Config = {
  brewfile: string;
  machines: {
    [section: string]: {
      taps?: readonly string[];
      formula?: readonly string[];
      casks?: readonly string[];
    };
  };
  metadata: {
    path: string;
    version: string;
  };
};
