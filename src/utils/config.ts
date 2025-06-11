import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { log } from "@clack/prompts";
import { type Result, err, ok } from "neverthrow";
import YAML from "yaml";
import type { Config } from "../types/config";
import { version } from "./version";

type ConfigResult = {
  config: Config;
  path: string;
  version: string;
};

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
  // biome-ignore lint/complexity/useLiteralKeys: It flip flops between lint failures for both.
  const input = process.env["HOPS_CONFIG"]?.trim();

  if (!input || input === "") {
    log.warn("HOPS_CONFIG environment variable not set, using default");
  }

  return resolve(input || `${homedir()}/hops.yml`);
};

export const getLastApplyPath = (): string => {
  return resolve(`${homedir()}/.hops-last-apply`);
};

export const getLastApplyTime = async (): Promise<
  Result<Date | null, Error>
> => {
  const path = getLastApplyPath();

  try {
    await access(path, constants.F_OK);
  } catch {
    return ok(null); // File doesn't exist, never applied before
  }

  try {
    const file = await readFile(path, "utf8");
    const timestamp = Number.parseInt(file.trim(), 10);
    if (Number.isNaN(timestamp)) {
      return err(new Error("Invalid timestamp in last apply file"));
    }
    return ok(new Date(timestamp));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new Error(`Reading last apply file: ${msg}`));
  }
};

export const setLastApplyTime = async (): Promise<Result<void, Error>> => {
  const path = getLastApplyPath();
  const timestamp = Date.now().toString();

  try {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(path, timestamp, "utf8");
    return ok(undefined);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new Error(`Writing last apply file: ${msg}`));
  }
};
