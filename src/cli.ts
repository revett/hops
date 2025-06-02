import { cac } from "cac";
import { commands } from "./commands";
import { version } from "./utils/version";

const cli = cac("hops");

commands.forEach((cmd) => {
  const command = cli.command(cmd.name, cmd.description);

  cmd.options?.forEach((opt) => {
    command.option(opt.flags, opt.description);
  });

  command.action(async (options) => {
    const result = await cmd.action(options);
    if (result.isErr()) {
      throw result.error;
    }
  });
});

cli.help();
cli.version(version);

// If no arguments are provided, show the help
if (!process.argv.slice(2).length) {
  cli.outputHelp();
}

// Find and run the command
try {
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(msg);
  process.exit(1);
}
