export type Command<T = Record<string, unknown>> = {
  name: string;
  description: string;
  options?: {
    flags: string;
    description: string;
    default?: string;
  }[];
  action: (options: T) => void | Promise<void>;
};
