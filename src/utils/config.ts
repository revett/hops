import type { Config } from "../types/config";
import { version } from "./version";
import { access, readFile } from "fs/promises";
import { constants } from "fs";
import YAML from "yaml";
import { homedir } from "os";
import { resolve } from "path";
import { Result, ok, err } from "neverthrow";

export const getConfig = async (): Promise<Result<Config, Error>> => {
  const path = getConfigPath();
  console.log(`🧩 Using config: ${path}`);

  try {
    await access(path, constants.F_OK);
  } catch {
    return err(new Error(`Config not found at ${path}`));
  }

  let config: Config;
  try {
    const file = await readFile(path, "utf8");
    config = YAML.parse(file);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new Error(`Parsing config at ${path}: ${msg}`));
  }

  if (!config.brewfile) {
    return err(new Error("Invalid config format: 'brewfile' is not defined"));
  }
  if (!config.machines) {
    return err(new Error("Invalid config format: 'machines' is not defined"));
  }

  config.metadata = {
    path: path,
    version: version,
  };

  return ok(config);
};

export const getConfigPath = (): string => {
  const input = process.env["HOPS_CONFIG"]?.trim();

  if (!input || input === "") {
    console.warn(
      "ℹ️ HOPS_CONFIG env variable is not set, falling back to default"
    );
  }

  return resolve(input || `${homedir()}/hops.yml`);
};
