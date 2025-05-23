import { access, readFile } from "fs/promises";
import { constants } from "fs";
import YAML from "yaml";
import { homedir } from "os";
import { resolve } from "path";
import type { Config } from "../types/config";
import { version } from "./version";

export const getConfig = async (): Promise<Config> => {
  const path = getConfigPath();
  console.log(`🧩 Using config: ${path}`);

  try {
    await access(path, constants.F_OK);
  } catch {
    console.error(`❌ Config file not found at ${path}`);
    console.error(`💡 Try running: hops init`);
    process.exit(1);
  }

  let config: Config;
  try {
    const file = await readFile(path, "utf8");
    config = YAML.parse(file);
  } catch (err) {
    console.error(`❌ Failed to parse config at ${path}`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  if (!config.brewfile) {
    console.error("❌ Invalid config format: 'brewfile' is not defined");
    process.exit(1);
  }
  if (!config.machines) {
    console.error("❌ Invalid config format: 'machines' is not defined");
    process.exit(1);
  }

  // TODO: Validate nothing in machines; no taps, formulae, or casks
  // TODO: Validate that we don't have duplicate taps, formulae, or casks defined

  config.metadata = {
    path: path,
    version: version,
  };

  return config;
};

export const getConfigPath = (): string => {
  const input = process.env.HOPS_CONFIG?.trim();

  if (input) {
    console.warn("ℹ️ HOPS_CONFIG env variable is set");
  }
  if (!input || input === "") {
    console.warn(
      "ℹ️ HOPS_CONFIG env variable is not set, falling back to default"
    );
  }

  return resolve(input || `${homedir()}/hops.yml`);
};
