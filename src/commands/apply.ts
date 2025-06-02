import { generateBrewfile } from "../services/brewfile";
import { confirm, isCancel, log } from '@clack/prompts';
import * as homebrew from "../services/homebrew";
import type { Command } from "../types/command";
import { getConfig } from "../utils/config";
import { Result, ok, err } from "neverthrow";
import pc from "picocolors"

type ApplyOptions = {
  machine?: string;
};

const action: (options: ApplyOptions) => Promise<Result<void, Error>> = async (
  options
) => {
  log.step(pc.bold('Reading hops.yml'));

  if (!options.machine) {
    return err(new Error("Machine flag is required"));
  }
  if (options.machine === "shared") {
    return err(new Error("Machine flag not allowed: shared"));
  }

  const configResult = await getConfig();
  if (configResult.isErr()) {
    return err(configResult.error);
  }
  const { config, version, path } = configResult.value;

  log.info([
    `Version: v${version}`,
    `Config: ${path}`,
    `Machine: ${options.machine}`,
  ].join('\n'));

  const generate = await generateBrewfile(config, options.machine, version, path);
  if (generate.isErr()) {
    return err(generate.error);
  }

  // List everything that is currently installed
  log.step(pc.bold('Installed taps'));
  const taps = await homebrew.listTaps(config.brewfile, "-");
  if (taps.isErr()) {
    return err(taps.error);
  }

  log.step(pc.bold('Installed formulae'));
  const formulae = await homebrew.listFormulae(config.brewfile, "-");
  if (formulae.isErr()) {
    return err(formulae.error);
  }

  log.step(pc.bold('Installed casks'));
  const casks = await homebrew.listCasks(config.brewfile, "-");
  if (casks.isErr()) {
    return err(casks.error);
  }

  // Cleanup packages not in Brewfile
  log.step(pc.bold('Checking for packages not in Brewfile'));
  const floating = await homebrew.listFloatingPackages(
    config.brewfile,
    "-"
  );
  if (floating.isErr()) {
    return err(floating.error);
  }
  if (!floating.value) {
    log.info('Check if any of the above packages need to be added to your hops.yml')
    const shouldContinue = await confirm({
      message: 'Uninstall these packages?',
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      log.error('Exiting early, no packages uninstalled');
      process.exit(0);
    }

    log.step(pc.bold('Removing packages'));
    const cleanup = await homebrew.forceCleanup(config.brewfile);
    if (cleanup.isErr()) {
      return err(cleanup.error);
    }

    log.success('Cleanup complete');
  } else {
    log.success('No packages to uninstall');
  }

  // Install and upgrade packages
  log.step(pc.bold('Install/upgrade packages from Brewfile'));
  const install = await homebrew.install(config.brewfile);
  if (install.isErr()) {
    return err(install.error);
  }

  // Final check
  log.step(pc.bold('Checking all packages in Brewfile are installed'));
  const allInstalled = await homebrew.check(config.brewfile);
  if (allInstalled.isErr()) {
    return err(allInstalled.error);
  }

  return ok(undefined);
};

export const apply = {
  name: "apply",
  description: "Install, update, and cleanup Homebrew packages",
  options: [
    {
      flags: "--machine <machine>",
      description: "Which machine to generate the Brewfile for",
    },
  ],
  action,
} satisfies Command<ApplyOptions>;
