import type { Command } from "../types/command";
import { apply } from "./apply";
import { generate } from "./generate";
import { init } from "./init";

export const commands: ReadonlyArray<Command> = [apply, generate, init];
