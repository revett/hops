import { confirm, intro, isCancel, log } from "@clack/prompts";
import { type Result, err, ok } from "neverthrow";
import pc from "picocolors";
import { generateBrewfile } from "../services/brewfile";
import * as homebrew from "../services/homebrew";
import type { Command } from "../types/command";
import {
  getConfig,
  getLastApplyPath,
  getLastApplyTime,
  setLastApplyTime,
} from "../utils/config";

type ApplyOptions = {
  machine?: string;
};

const action: (options: ApplyOptions) => Promise<Result<void, Error>> = async (
  options,
) => {
  intro(pc.bgGreen(pc.bold("hops")));
  log.step(pc.bold("Reading hops.yml"));

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

  const lastApplyResult = await getLastApplyTime();
  if (lastApplyResult.isErr()) {
    return err(lastApplyResult.error);
  }

  let lastApply = "Never";
  if (lastApplyResult.isOk() && lastApplyResult.value) {
    const daysSince = Math.floor(
      (Date.now() - lastApplyResult.value.getTime()) / (1000 * 60 * 60 * 24),
    );
    lastApply = `${daysSince} day${daysSince === 1 ? "" : "s"}`;
  }

  log.info(
    [
      `Version: v${version}`,
      `Config: ${path}`,
      `Machine: ${options.machine}`,
      `Last apply: ${lastApply}`,
    ].join("\n"),
  );

  const generate = await generateBrewfile(
    config,
    options.machine,
    version,
    path,
  );
  if (generate.isErr()) {
    return err(generate.error);
  }

  // List everything that is currently installed
  log.step(pc.bold("Installed taps"));
  const taps = await homebrew.listTaps(config.brewfile, "-");
  if (taps.isErr()) {
    return err(taps.error);
  }

  log.step(pc.bold("Installed formulae"));
  const formulae = await homebrew.listFormulae(config.brewfile, "-");
  if (formulae.isErr()) {
    return err(formulae.error);
  }

  log.step(pc.bold("Installed casks"));
  const casks = await homebrew.listCasks(config.brewfile, "-");
  if (casks.isErr()) {
    return err(casks.error);
  }

  // Cleanup packages not in Brewfile
  log.step(pc.bold("Checking for packages not in Brewfile"));
  const floating = await homebrew.listFloatingPackages(config.brewfile, "-");
  if (floating.isErr()) {
    return err(floating.error);
  }
  if (!floating.value) {
    log.warn(
      "Check if any of the above packages need to be added to your hops.yml",
    );
    const shouldContinue = await confirm({
      message: "Uninstall these packages?",
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      log.error("Exiting early, no packages uninstalled");
      process.exit(0);
    }

    log.step(pc.bold("Removing packages"));
    console.log(pc.gray("│"));
    const cleanup = await homebrew.forceCleanup(config.brewfile);
    if (cleanup.isErr()) {
      return err(cleanup.error);
    }

    log.success("Cleanup complete");
  } else {
    log.info("No packages to uninstall");
  }

  // Install and upgrade packages
  log.step(pc.bold("Install/upgrade packages from Brewfile"));
  console.log(pc.gray("│")); // Unable to use clack/prompts logging here as streaming so need pipe
  const install = await homebrew.install(config.brewfile);
  if (install.isErr()) {
    return err(install.error);
  }

  // Final check
  log.step(pc.bold("Checking all packages in Brewfile are installed"));
  const allInstalled = await homebrew.check(config.brewfile);
  if (allInstalled.isErr()) {
    return err(allInstalled.error);
  }

  // Update last run time for reminder feature
  log.success(`Updating timestamp: ${getLastApplyPath()}`);
  const setLastApply = await setLastApplyTime();
  if (setLastApply.isErr()) {
    // Don't fail the entire command if we can't update the timestamp
    log.warn("Could not update last apply time for reminders");
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
