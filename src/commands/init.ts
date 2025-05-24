import type { Command } from "../types/command";
import type { Config } from "../types/config";
import { getConfigPath } from "../utils/config";
import { fileExists } from "../utils/file";
import { homedir } from "os";
import { writeFile } from "fs/promises";
import YAML from "yaml";

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

  if (await fileExists(path)) {
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

export const init = {
  name: "init",
  description: "Initialize new hops.yml config",
  action,
} satisfies Command;
