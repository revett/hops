import { generateBrewfile } from "../services/brewfile";
import * as homebrew from "../services/homebrew";
import type { Command } from "../types/command";
import { getConfig } from "../utils/config";
import { createInterface } from "readline";

type ApplyOptions = {
  machine?: string;
};

const displayList = (items: string[], label: string): void => {
  console.log(`\n📦 Listing ${label} in Brewfile`);
  if (items.length > 0) {
    items.forEach((item) => console.log(`- ${item}`));
  } else {
    console.log("- None.");
  }
};

const promptUser = async (message: string): Promise<boolean> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer === "");
    });
  });
};

const action: (options: ApplyOptions) => Promise<void> = async (options) => {
  if (!options.machine) {
    throw new Error("Machine flag is required");
  }
  if (options.machine === "shared") {
    throw new Error("Machine flag not allowed: shared");
  }

  console.log(`🖥️ Machine: ${options.machine}`);

  const config = await getConfig();
  if (config.isErr()) {
    throw new Error(config.error.message);
  }
  const ok = await generateBrewfile(config.value, options.machine);
  if (ok.isErr()) {
    throw new Error(ok.error.message);
  }

  // List packages.
  const taps = await homebrew.listTaps(config.value.brewfile);
  if (taps.isErr()) {
    throw new Error(taps.error.message);
  }
  displayList(taps.value, "taps");

  const formulae = await homebrew.listFormulae(config.value.brewfile);
  if (formulae.isErr()) {
    throw new Error(formulae.error.message);
  }
  displayList(formulae.value, "formulae");

  const casks = await homebrew.listCasks(config.value.brewfile);
  if (casks.isErr()) {
    throw new Error(casks.error.message);
  }
  displayList(casks.value, "casks");

  // Cleanup packages not in Brewfile.
  console.log("\n🧹 Checking for packages not in Brewfile");
  const floatingDeps = await homebrew.listFloatingDependencies(
    config.value.brewfile
  );
  if (floatingDeps.isErr()) {
    throw new Error(floatingDeps.error.message);
  }
  if (floatingDeps.value.length > 0) {
    floatingDeps.value.forEach((f) => console.log(`- ${f}`));

    console.log(
      "\n🚧 STOP! Do any of the above packages need to be added to the Brewfile?"
    );
    const proceed = await promptUser(
      "Press ENTER to proceed with cleanup, any other key to exit: "
    );

    if (!proceed) {
      console.log("❌ Exiting without cleanup.");
      process.exit(0);
    }

    console.log("\n🗑️ Removing packages...");
    const cleanup = await homebrew.forceCleanup(config.value.brewfile);
    if (cleanup.isErr()) {
      throw new Error(cleanup.error.message);
    }
    console.log("✅ Cleanup complete");
  } else {
    console.log("✅ No packages to remove");
  }

  // Install and upgrade packages.
  console.log("\n📥 Installing and upgrading packages from Brewfile");
  const install = await homebrew.install(config.value.brewfile);
  if (install.isErr()) {
    throw new Error(install.error.message);
  }

  // Final check.
  console.log("\n🔍 Checking all packages in Brewfile are installed");
  const allInstalled = await homebrew.check(config.value.brewfile);
  if (allInstalled.isErr()) {
    throw new Error(allInstalled.error.message);
  }
  if (allInstalled.value) {
    console.log("✅ All packages are installed");
  } else {
    console.warn("⚠️ Some packages may not be installed correctly");
  }

  console.log("\n✨ Hops apply completed successfully!");
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
