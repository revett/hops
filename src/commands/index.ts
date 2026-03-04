import type { Command } from "../types/command";
import { apply } from "./apply";
import { format } from "./format";
import { generate } from "./generate";
import { init } from "./init";
import { reminder } from "./reminder";

export const commands: ReadonlyArray<Command> = [
  apply,
  format,
  generate,
  init,
  reminder,
];
