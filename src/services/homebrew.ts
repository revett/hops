import { execa } from "execa";
import { err, ok, type Result } from "neverthrow";
import pc from "picocolors";
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

export type Floating = {
  casks: string[];
  formulae: string[];
  taps: string[];
  extensions: string[];
};

// Section headers printed by the `brew bundle cleanup` dry run, mapped to the
// kind of package listed beneath them. Anything from "Would `brew cleanup`:"
// onwards is cache, handled separately by `cleanupCache`.
const FLOATING_SECTIONS: Record<string, keyof Floating> = {
  "Would uninstall casks:": "casks",
  "Would uninstall formulae:": "formulae",
  "Would untap:": "taps",
  "Would uninstall VSCode extensions:": "extensions",
};

export async function listFloatingPackages(
  brewfilePath: string,
  ignore: readonly string[],
  prefix: string,
): Promise<Result<Floating | null, Error>> {
  // Returns null when there is nothing to uninstall
  const result = await execa({
    env: createEnv(brewfilePath),
    lines: true,
    reject: false,
    stdin: "inherit",
  })`brew bundle cleanup`;

  const floating: Floating = {
    casks: [],
    formulae: [],
    taps: [],
    extensions: [],
  };
  let section: keyof Floating | null = null;

  for (const line of result.stdout) {
    if (line.startsWith("Would `brew cleanup`:")) {
      break;
    }
    if (line.startsWith("Run `brew bundle cleanup") || line.trim() === "") {
      continue;
    }
    if (line.startsWith("Would ")) {
      section = FLOATING_SECTIONS[line] ?? null;
      if (section === null) {
        return err(
          new Error(`Unrecognised brew bundle cleanup section: ${line}`),
        );
      }
      continue;
    }
    if (section === null) {
      return err(new Error(`Unexpected brew bundle cleanup output: ${line}`));
    }
    // Homebrew may print several names per line when not attached to a TTY
    floating[section].push(...line.trim().split(/\s+/));
  }

  const ignored: string[] = [];
  for (const key of Object.keys(floating) as (keyof Floating)[]) {
    floating[key] = floating[key].filter((name) => {
      if (ignore.includes(name)) {
        ignored.push(name);
        return false;
      }
      return true;
    });
  }

  const names = Object.values(floating).flat().sort();
  const lines = [
    ...names.map((n) => `${prefix} ${n}`),
    ...ignored.sort().map((n) => pc.dim(`${prefix} ${n} (ignored)`)),
  ];
  if (lines.length > 0) {
    log.info(lines.join("\n"));
  }

  return ok(names.length > 0 ? floating : null);
}

// Uninstall everything reported by `listFloatingPackages`. This replaces
// `brew bundle --force cleanup`, which would also uninstall ignored packages
// since they are deliberately absent from the Brewfile.
export async function uninstall(
  floating: Floating,
): Promise<Result<void, Error>> {
  const commands: [string, string[]][] = [];
  if (floating.casks.length > 0) {
    commands.push(["brew", ["uninstall", "--cask", ...floating.casks]]);
  }
  if (floating.formulae.length > 0) {
    commands.push(["brew", ["uninstall", "--formula", ...floating.formulae]]);
  }
  if (floating.taps.length > 0) {
    commands.push(["brew", ["untap", ...floating.taps]]);
  }
  if (floating.extensions.length > 0) {
    commands.push([
      "cursor",
      floating.extensions.flatMap((e) => ["--uninstall-extension", e]),
    ]);
  }

  for (const [file, args] of commands) {
    const result = await execa(file, args, {
      reject: false,
      stdin: "inherit",
      stdout: ["inherit", "pipe"],
    });

    capture(result.stdout);

    if (result.exitCode !== 0) {
      return err(
        new Error(
          `Homebrew command failed with exit code ${result.exitCode}: ${file} ${args.join(" ")}`,
        ),
      );
    }
  }

  return ok(undefined);
}

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
