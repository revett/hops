import type { Config } from "../types/config";
import { version } from "./version";
import { access, readFile } from "fs/promises";
import { constants } from "fs";
import YAML from "yaml";
import { homedir } from "os";
import { resolve } from "path";
import { Result, ok, err } from "neverthrow";
import { log } from "@clack/prompts";

type ConfigResult = {
  config: Config;
  path: string;
  version: string;
}

export const getConfig = async (): Promise<Result<ConfigResult, Error>> => {
  const path = getConfigPath();

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

  const result: ConfigResult = {
    config: config,
    path: path,
    version: version,
  };

  return ok(result);
};

export const getConfigPath = (): string => {
  const input = process.env["HOPS_CONFIG"]?.trim();

  if (!input || input === "") {
    log.warn("HOPS_CONFIG environment variable not set, using default");
  }

  return resolve(input || `${homedir()}/hops.yml`);
};
