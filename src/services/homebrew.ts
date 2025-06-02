import { execa } from "execa";
import { Result, ok, err } from "neverthrow";

export function createEnv(brewfilePath: string): Record<string, string> {
  return {
    HOMEBREW_BUNDLE_FILE: brewfilePath,
  }
}

export async function listTaps(
  brewfilePath: string,
  prefix: string
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle list --taps`;

  if (result.exitCode !== 0) {
    console.log(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle list --taps`
      )
    );
  }

  const lines = result.stdout.filter(Boolean);
  for (const l of lines) {
    console.log(`${prefix} ${l}`);
  }

  return ok(undefined);
}

export async function listFormulae(
  brewfilePath: string,
  prefix: string
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle list --brews`;

  if (result.exitCode !== 0) {
    console.log(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle list --brews`
      )
    );
  }

  const lines = result.stdout.filter(Boolean);
  for (const l of lines) {
    console.log(`${prefix} ${l}`);
  }

  return ok(undefined);
}

export async function listCasks(
  brewfilePath: string,
  prefix: string
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle list --casks`;

  if (result.exitCode !== 0) {
    console.log(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle list --casks`
      )
    );
  }

  const lines = result.stdout.filter(Boolean);
  for (const l of lines) {
    console.log(`${prefix} ${l}`);
  }

  return ok(undefined);
}

export async function listFloatingPackages(
  brewfilePath: string,
  prefix: string
): Promise<Result<boolean, Error>> { // Returns (ok, err) where ok is true if no packages to remove
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle cleanup`;

  // List of known log lines that we want to filter out, as not relevant
  const blockListLinePrefixes = [
    "Would uninstall ",
    "Would `brew cleanup`:",
    "Run `brew bundle cleanup",
  ]

  const lines = result.stdout.filter(line => {
    return !blockListLinePrefixes.some(prefix => line.startsWith(prefix));
  });

  // Remove "Would remove: " prefix from lines that start with it
  const processedLines = lines.map(line => {
    if (line.startsWith("Would remove: ")) {
      return line.substring("Would remove: ".length);
    }
    return line;
  });

  if (processedLines.length > 0) {
    for (const l of processedLines) {
      console.log(`${prefix} ${l}`);
    }

    return ok(false);
  }

  return ok(true);
}

export async function forceCleanup(
  brewfilePath: string
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    reject: false,
    stdin: "inherit",
    stdout: "inherit",
  })`brew bundle --force cleanup`;

  if (result.exitCode !== 0) {
    console.log(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle --force cleanup`
      )
    );
  }

  return ok(undefined);
}

export async function install(
  brewfilePath: string
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    reject: false,
    stdin: "inherit",
    stdout: "inherit",
  })`brew bundle install`;

  if (result.exitCode !== 0) {
    console.log(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle install`
      )
    );
  }

  return ok(undefined);
}

export async function check(
  brewfilePath: string
): Promise<Result<void, Error>> {
  const result = await execa({
    env: createEnv(brewfilePath),
    reject: false,
    stdin: "inherit",
    stdout: "inherit",
  })`brew bundle check`;

  if (result.exitCode !== 0) {
    console.log(result.message);
    return err(
      new Error(
        `Homebrew command failed with exit code ${result.exitCode}: brew bundle check`
      )
    );
  }

  return ok(undefined);
}
