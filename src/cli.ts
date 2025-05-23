import { cac } from "cac";
import { commands } from "./commands";
import { version } from "./utils/version";

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
cli.version(version);

// If no arguments are provided, show the help.
if (!process.argv.slice(2).length) {
  cli.outputHelp();
}

// Find and run the command.
try {
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(msg);
  process.exit(1);
}
