import type { Command } from "../types/command";
import type { Config } from "../types/config";
import { getConfigPath } from "../utils/config";
import { fileExists } from "../utils/file";
import { homedir } from "os";
import { writeFile } from "fs/promises";
import YAML from "yaml";
import { Result, ok, err } from "neverthrow";

// Default config with a few example packages to illustrate the structure
const defaultConfig: Config = {
  brewfile: `${homedir()}/Brewfile`,
  machines: {
    shared: {
      taps: ["homebrew/bundle"],
      formulae: ["coreutils"],
      casks: ["1password", "raycast", "spotify"],
    },
    personal: { casks: ["adobe-creative-cloud"] },
    work: {
      casks: ["cursor", "loom", "slack"],
      cursor: ["dbaeumer.vscode-eslint", "github.github-vscode-theme"],
    },
  },
};

const action: () => Promise<Result<void, Error>> = async () => {
  const path = getConfigPath();

  if (await fileExists(path)) {
    return err(new Error(`Config file already exists at ${path}`));
  }

  const yaml = YAML.stringify(defaultConfig);

  try {
    await writeFile(path, yaml, "utf8");
    console.log(`✅ Created hops config at: ${path}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new Error(`Writing to config at ${path}: ${msg}`));
  }

  return ok(undefined);
};

export const init = {
  name: "init",
  description: "Initialize new hops.yml config",
  action,
} satisfies Command;
