import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { intro, log } from "@clack/prompts";
import { type Result, err, ok } from "neverthrow";
import pc from "picocolors";
import YAML from "yaml";
import type { Command } from "../types/command";
import type { Config } from "../types/config";
import { getConfigPath } from "../utils/config";
import { fileExists } from "../utils/file";

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
  intro(pc.bgGreen(pc.bold("hops")));
  log.step(pc.bold("Initializing new hops.yml config"));

  const path = getConfigPath();

  if (await fileExists(path)) {
    return err(new Error(`Config file already exists: ${path}`));
  }

  const yaml = YAML.stringify(defaultConfig);

  try {
    await writeFile(path, yaml, "utf8");
    log.success(`Created config: ${path}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new Error(`Writing to config: ${path}: ${msg}`));
  }

  return ok(undefined);
};

export const init = {
  name: "init",
  description: "Initialize new hops.yml config",
  action,
} satisfies Command;
