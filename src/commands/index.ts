import type { Command } from "../types/command";
import { apply } from "./apply";
import { generate } from "./generate";
import { init } from "./init";

export const commands: ReadonlyArray<Command> = [apply, generate, init];

// export const commands = [
//   {
//     name: "apply",
//     description: "Install and update dependencies",
//     action: () => {
//       console.log("...");
//     },
//   },
//   {
//     name: "list",
//     description: "List packages for a given profile",
//     action: () => {
//       console.log("...");
//     },
//   },
// ];
