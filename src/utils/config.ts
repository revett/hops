import type { Config } from "../types/config";
import { version } from "./version";
import { access, readFile } from "fs/promises";
import { constants } from "fs";
import YAML from "yaml";
import { homedir } from "os";
import { resolve } from "path";

export const getConfig = async (): Promise<Config> => {
  const path = getConfigPath();
  console.log(`🧩 Using config: ${path}`);

  try {
    await access(path, constants.F_OK);
  } catch {
    throw new Error(`Config not found at ${path}`);
  }

  let config: Config;
  try {
    const file = await readFile(path, "utf8");
    config = YAML.parse(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to parse config at ${path}: ${msg}`);
  }

  if (!config.brewfile) {
    throw new Error("Invalid config format: 'brewfile' is not defined");
  }
  if (!config.machines) {
    throw new Error("Invalid config format: 'machines' is not defined");
  }

  config.metadata = {
    path: path,
    version: version,
  };

  return config;
};

export const getConfigPath = (): string => {
  const input = process.env.HOPS_CONFIG?.trim();

  if (!input || input === "") {
    console.warn(
      "ℹ️ HOPS_CONFIG env variable is not set, falling back to default"
    );
  }

  return resolve(input || `${homedir()}/hops.yml`);
};
