import { cac } from "cac";
import { commands } from "./commands";
import * as logger from "./utils/logger";
import { version } from "./utils/version";

const cli = cac("hops");

for (const cmd of commands) {
  const command = cli.command(cmd.name, cmd.description);

  for (const opt of cmd.options ?? []) {
    command.option(opt.flags, opt.description);
  }

  command.action(async (options) => {
    const result = await cmd.action(options);
    if (result.isErr()) {
      throw result.error;
    }
  });
}

cli.help();
cli.version(version);

// If no arguments are provided, show the help
if (!process.argv.slice(2).length) {
  cli.outputHelp();
} else {
  logger.init();
}

// Find and run the command
try {
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  logger.log.error(msg);
  process.exit(1);
}
