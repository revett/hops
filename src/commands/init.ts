import type { Command } from "../types/command";
import type { Config } from "../types/config";
import { homedir } from "os";
import { resolve } from "path";
import { access, writeFile } from "fs/promises";
import { constants } from "fs";
import YAML from "yaml";

// Default config with a few example packages to illustrate the structure.
const defaultConfig: Config = {
  shared: {
    taps: ["homebrew/bundle"],
    formula: ["coreutils"],
    casks: ["1password", "raycast", "spotify"],
  },
  personal: { casks: ["adobe-creative-cloud"] },
  work: { casks: ["loom", "slack"] },
};

const action = async (options: Record<string, any>) => {
  console.log(options);

  const path = resolve(options.path || `${homedir()}/hops.yml`);

  try {
    await access(path, constants.F_OK);
    console.error(`❌ Config file already exists at ${path}`);
    process.exit(1);
  } catch {
    // OK.
  }

  const yaml = YAML.stringify(defaultConfig);

  try {
    await writeFile(path, yaml, "utf8");
    console.log(`✅ Created hops config at: ${path}`);
  } catch (err) {
    console.error("❌ Failed to write config:", err);
    process.exit(1);
  }
};

export const init: Command = {
  name: "init",
  description: "Initialize a new YAML config.",
  options: [
    {
      flags: "--path <path>",
      description: "Path to config file.",
      default: `${homedir()}/hops.yml`,
    },
  ],
  action,
};
