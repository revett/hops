import { generateBrewfile } from "../services/brewfile";
import { cancel, confirm, intro, isCancel, log, outro} from '@clack/prompts';
import * as homebrew from "../services/homebrew";
import type { Command } from "../types/command";
import { getConfig } from "../utils/config";
import { Result, ok, err } from "neverthrow";

type ApplyOptions = {
  machine?: string;
};


const action: (options: ApplyOptions) => Promise<Result<void, Error>> = async (
  options
) => {
  intro('hops');

  if (!options.machine) {
    return err(new Error("Machine flag is required"));
  }
  if (options.machine === "shared") {
    return err(new Error("Machine flag not allowed: shared"));
  }

  console.log(`🖥️ Machine: ${options.machine}`);

  const config = await getConfig();
  if (config.isErr()) {
    return err(config.error);
  }
  const generate = await generateBrewfile(config.value, options.machine);
  if (generate.isErr()) {
    return err(generate.error);
  }

  // List everything that is currently installed
  console.log(`\n📦 Installed taps`);
  const taps = await homebrew.listTaps(config.value.brewfile, "-");
  if (taps.isErr()) {
    return err(taps.error);
  }

  console.log(`\n📦 Installed formulae`);
  const formulae = await homebrew.listFormulae(config.value.brewfile, "-");
  if (formulae.isErr()) {
    return err(formulae.error);
  }

  console.log(`\n📦 Installed casks`);
  const casks = await homebrew.listCasks(config.value.brewfile, "-");
  if (casks.isErr()) {
    return err(casks.error);
  }

  // Cleanup packages not in Brewfile
  console.log("\n🧹 Checking for packages not in Brewfile");
  const floating = await homebrew.listFloatingPackages(
    config.value.brewfile,
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

    console.log("\n🗑️ Removing packages");
    const cleanup = await homebrew.forceCleanup(config.value.brewfile);
    if (cleanup.isErr()) {
      return err(cleanup.error);
    }

    console.log("✅ Cleanup complete");
  } else {
    console.log("✅ No packages to remove");
  }

  // Install and upgrade packages
  console.log("\n📥 Installing and upgrading packages from Brewfile");
  const install = await homebrew.install(config.value.brewfile);
  if (install.isErr()) {
    return err(install.error);
  }

  // Final check
  console.log("\n🔍 Checking all packages in Brewfile are installed");
  const allInstalled = await homebrew.check(config.value.brewfile);
  if (allInstalled.isErr()) {
    return err(allInstalled.error);
  }

  console.log("\n✨ Hops apply completed successfully!");

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
