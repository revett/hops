import { cac } from "cac";
import { commands } from "./commands";
import pkg from "../package.json" assert { type: "json" };

const cli = cac("hops");

commands.forEach((cmd) => {
  const command = cli.command(cmd.name, cmd.description);

  cmd.options?.forEach((opt) => {
    if (opt.default !== undefined) {
      command.option(opt.flags, opt.description, { default: opt.default });
    } else {
      command.option(opt.flags, opt.description);
    }
  });

  command.action(cmd.action);
});

cli.help();
cli.parse();
cli.version(pkg.version);
