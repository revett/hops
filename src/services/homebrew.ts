import { execa } from "execa";
import { err, ok, type Result } from "neverthrow";
import { capture, log, output } from "../utils/logger";

export function createEnv(brewfilePath: string): Record<string, string> {
  return {
    HOMEBREW_BUNDLE_FILE: brewfilePath,
  };
}

export async function listTaps(
  brewfilePath: string,
  prefix: string,
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle list --taps`;

  if (result.exitCode !== 0) {
    output(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle list --taps`,
      ),
    );
  }

  const lines = result.stdout.filter(Boolean);
  if (lines.length === 0) {
    log.info(`${prefix} None`);
    return ok(undefined);
  }
  log.info(lines.map((l) => `${prefix} ${l}`).join("\n"));

  return ok(undefined);
}

export async function listFormulae(
  brewfilePath: string,
  prefix: string,
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle list --brews`;

  if (result.exitCode !== 0) {
    output(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle list --brews`,
      ),
    );
  }

  const lines = result.stdout.filter(Boolean);
  if (lines.length === 0) {
    log.info(`${prefix} None`);
    return ok(undefined);
  }
  log.info(lines.map((l) => `${prefix} ${l}`).join("\n"));

  return ok(undefined);
}

export async function listCasks(
  brewfilePath: string,
  prefix: string,
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle list --casks`;

  if (result.exitCode !== 0) {
    output(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle list --casks`,
      ),
    );
  }

  const lines = result.stdout.filter(Boolean);
  if (lines.length === 0) {
    log.info(`${prefix} None`);
    return ok(undefined);
  }
  log.info(lines.map((l) => `${prefix} ${l}`).join("\n"));

  return ok(undefined);
}

export async function listFloatingPackages(
  brewfilePath: string,
  prefix: string,
): Promise<Result<boolean, Error>> {
  // Returns (ok, err) where ok is true if no packages to remove
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle cleanup`;

  // The dry run output is a series of sections, each introduced by a "Would ..."
  // header followed by one entry per line. The final section, "Would `brew
  // cleanup`:", lists cache files rather than packages, so everything from
  // that header onwards is ignored here; the cache is removed separately by
  // `cleanupCache` on every run.
  const cacheHeaderIndex = result.stdout.findIndex((l) =>
    l.startsWith("Would `brew cleanup`:"),
  );
  const packageLines =
    cacheHeaderIndex === -1
      ? result.stdout
      : result.stdout.slice(0, cacheHeaderIndex);

  const packages = packageLines.filter(
    (l) =>
      l.trim() !== "" &&
      !l.startsWith("Would ") &&
      !l.startsWith("Run `brew bundle cleanup"),
  );

  if (packages.length > 0) {
    log.info(packages.map((l) => `${prefix} ${l}`).join("\n"));
    return ok(false);
  }

  return ok(true);
}

// Purges old formula/cask versions and stale downloads. Deliberately runs
// without --scrub so recent downloads survive and aren't fetched again next run.
export async function cleanupCache(): Promise<Result<void, Error>> {
  const result = await execa({
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew cleanup`;

  if (result.exitCode !== 0) {
    output(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew cleanup`,
      ),
    );
  }

  // Output is empty when there was nothing to remove
  const lines = result.stdout.filter(Boolean);
  if (lines.length > 0) {
    log.info(lines.join("\n"));
  }

  return ok(undefined);
}

export async function forceCleanup(
  brewfilePath: string,
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    reject: false,
    stdin: "inherit",
    stdout: ["inherit", "pipe"],
  })`brew bundle --force cleanup`;

  capture(result.stdout);

  if (result.exitCode !== 0) {
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle --force cleanup`,
      ),
    );
  }

  return ok(undefined);
}

export async function install(
  brewfilePath: string,
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    reject: false,
    stdin: "inherit",
    stdout: ["inherit", "pipe"],
  })`brew bundle install`;

  capture(result.stdout);

  if (result.exitCode !== 0) {
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle install`,
      ),
    );
  }

  return ok(undefined);
}

export async function check(
  brewfilePath: string,
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle check`;

  if (result.exitCode !== 0) {
    output(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle check`,
      ),
    );
  }

  const lines = result.stdout.filter(Boolean);

  if (lines.length === 1 && lines[0]?.endsWith(".")) {
    log.info(lines[0].substring(0, lines[0].length - 1));
    return ok(undefined);
  }

  log.info(lines.join("\n"));

  return ok(undefined);
}
