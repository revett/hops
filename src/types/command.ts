export type Command = {
  name: string;
  description: string;
  options?: {
    flags: string;
    description: string;
    default?: any;
  }[];
  action: (options: Record<string, any>) => Promise<void> | void;
};
