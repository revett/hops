import type { Command } from "../types/command";
import { init } from "./init";

export const commands: Command[] = [init];

// export const commands = [
//   {
//     name: "apply",
//     description: "Install and update dependencies",
//     action: () => {
//       console.log("...");
//     },
//   },
//   {
//     name: "generate",
//     description: "Update local Brewfile from YAML config",
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
