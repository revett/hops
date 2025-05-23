import type { Command } from "../types/command";
import type { Config } from "../types/config";
import { homedir } from "os";
import { access, writeFile } from "fs/promises";
import { constants } from "fs";
import YAML from "yaml";
import { getConfigPath } from "../utils/config";
import { exists } from "../utils/file";

// Default config with a few example packages to illustrate the structure.
const defaultConfig: Config = {
  brewfile: `${homedir()}/Brewfile`,
  machines: {
    shared: {
      taps: ["homebrew/bundle"],
      formulae: ["coreutils"],
      casks: ["1password", "raycast", "spotify"],
    },
    personal: { casks: ["adobe-creative-cloud"] },
    work: { casks: ["loom", "slack"] },
  },
};

const action: () => Promise<void> = async () => {
  const path = getConfigPath();

  if (await exists(path)) {
    throw new Error(`Config file already exists at ${path}`);
  }

  const yaml = YAML.stringify(defaultConfig);

  try {
    await writeFile(path, yaml, "utf8");
    console.log(`✅ Created hops config at: ${path}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to write to config at ${path}: ${msg}`);
  }
};

export const init: Command = {
  name: "init",
  description: "Initialize a new YAML config",
  action,
};
