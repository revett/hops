import { cac } from "cac";
import pkgjson from "../package.json" assert { type: "json" };

const cli = cac("hops");

const commands = [
  {
    name: "apply",
    description: "Install and update dependencies",
    action: () => {
      console.log("...");
    },
  },
  {
    name: "generate",
    description: "Update local Brewfile from YAML config",
    action: () => {
      console.log("...");
    },
  },
  {
    name: "init",
    description: "Initialize a new YAML config",
    action: () => {
      console.log("...");
    },
  },
  {
    name: "list",
    description: "List packages for a given profile",
    action: () => {
      console.log("...");
    },
  },
  {
    name: "version",
    description: "Show the current version",
    action: () => {
      console.log(pkgjson.version);
    },
  },
];

commands.forEach((command) => {
  cli.command(command.name, command.description).action(command.action);
});

cli.help();
cli.parse();

// If no known command is provided, show help.
const args = process.argv.slice(2);
if (args.length === 0 || !cli.matchedCommand) {
  cli.outputHelp();
  process.exit(1);
}
