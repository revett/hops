import { confirm, isCancel, log } from "@clack/prompts";
import { execa } from "execa";
import { err, ok, type Result } from "neverthrow";
import pc from "picocolors";
import type { Config } from "../types/config";

/**
 * Collect npm packages from the shared and target machine configs.
 * Returns null if no npm section is defined on either machine.
 */
export function collectNpmConfig(
  config: Config,
  machine: string,
): { version: string; packages: string[] } | null {
  const shared = config.machines["shared"]?.npm;
  const target = config.machines[machine]?.npm;

  if (!shared && !target) {
    return null;
  }

  // Use the first version found (target takes precedence over shared)
  const version = target?.version ?? shared?.version;
  if (!version) {
    return null;
  }

  const packages = new Set<string>();
  for (const pkg of shared?.packages ?? []) {
    packages.add(pkg);
  }
  for (const pkg of target?.packages ?? []) {
    packages.add(pkg);
  }

  if (packages.size === 0) {
    return null;
  }

  return { version, packages: [...packages].sort() };
}

/**
 * Verify that node is on PATH and matches the expected major version.
 */
async function checkNodeVersion(
  expectedMajor: string,
): Promise<Result<string, Error>> {
  const result = await execa({ reject: false })`node -v`;

  if (result.exitCode !== 0) {
    return err(new Error("node not found on PATH; install Node and retry"));
  }

  const raw = result.stdout.trim();
  const actual = raw.replace(/^v/, "").split(".")[0];

  if (actual !== expectedMajor) {
    return err(
      new Error(
        `Expected Node ${expectedMajor}, got ${actual}; activate correct version and retry`,
      ),
    );
  }

  return ok(raw);
}

/**
 * Preflight check for npm: verifies Node is on PATH and the major version
 * matches what's declared in hops.yml. Runs early in the apply flow so the
 * user finds out about version mismatches before sitting through Homebrew.
 *
 * Returns the detected Node version string, or null if no npm section exists.
 */
export async function preflightNpm(
  config: Config,
  machine: string,
): Promise<Result<string | null, Error>> {
  log.step(pc.bold("NPM preflight"));

  const npmConfig = collectNpmConfig(config, machine);
  if (!npmConfig) {
    log.info("No npm section in hops.yml, skipping");
    return ok(null);
  }

  const versionResult = await checkNodeVersion(npmConfig.version);
  if (versionResult.isErr()) {
    return err(versionResult.error);
  }

  log.success(
    `Node ${versionResult.value} (expected major: ${npmConfig.version})`,
  );
  return ok(versionResult.value);
}

type PackageInfo = {
  name: string;
  version: string;
};

/**
 * Get globally installed npm packages with their versions (top-level only).
 */
async function listGlobalPackages(): Promise<Result<PackageInfo[], Error>> {
  const result = await execa({
    reject: false,
  })`npm ls -g --depth=0 --json`;

  if (result.exitCode !== 0 && !result.stdout) {
    return err(new Error("Failed to list global npm packages"));
  }

  try {
    const parsed = JSON.parse(result.stdout);
    const deps = parsed.dependencies ?? {};
    const packages: PackageInfo[] = Object.entries(deps)
      .map(([name, info]) => ({
        name,
        version: (info as { version?: string }).version ?? "unknown",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok(packages);
  } catch {
    return err(new Error("Failed to parse npm ls output"));
  }
}

/**
 * Get the version of a single globally installed package.
 */
async function getPackageVersion(pkg: string): Promise<string> {
  const result = await execa({
    reject: false,
  })`npm ls -g ${pkg} --depth=0 --json`;

  try {
    const parsed = JSON.parse(result.stdout);
    return parsed.dependencies?.[pkg]?.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Sync npm global packages: install missing, upgrade existing, remove floating.
 * Mirrors the Homebrew diff/sync pattern used elsewhere in hops.
 *
 * Only call this after preflightNpm has passed. If no npm section exists in the
 * config this is a no-op (preflight already logged the skip message).
 */
export async function syncNpmPackages(
  config: Config,
  machine: string,
): Promise<Result<void, Error>> {
  const npmConfig = collectNpmConfig(config, machine);
  if (!npmConfig) {
    return ok(undefined);
  }

  // List what's currently installed
  log.step(pc.bold("Installed npm packages"));
  const installedResult = await listGlobalPackages();
  if (installedResult.isErr()) {
    return err(installedResult.error);
  }

  if (installedResult.value.length > 0) {
    log.info(
      installedResult.value
        .map((p) => `- ${p.name} ${pc.gray(p.version)}`)
        .join("\n"),
    );
  } else {
    log.info("- None");
  }

  const desired = new Set(npmConfig.packages);

  // Diff: floating packages (installed but not in config)
  const floating = installedResult.value.filter((p) => !desired.has(p.name));

  // Remove floating packages
  log.step(pc.bold("Checking for npm packages not in hops.yml"));
  if (floating.length > 0) {
    log.info(
      floating.map((p) => `- ${p.name} ${pc.gray(p.version)}`).join("\n"),
    );
    log.warn(
      "Check if any of the above packages need to be added to your hops.yml",
    );

    const shouldUninstall = await confirm({
      message: "Uninstall these npm packages?",
    });

    if (isCancel(shouldUninstall) || !shouldUninstall) {
      log.error("Exiting early, no npm packages uninstalled");
      process.exit(0);
    }

    for (const pkg of floating) {
      const result = await execa({
        reject: false,
      })`npm uninstall -g ${pkg.name}`;

      if (result.exitCode !== 0) {
        return err(
          new Error(
            `npm uninstall failed with exit code ${result.exitCode}: npm uninstall -g ${pkg.name}`,
          ),
        );
      }
    }

    log.success(
      `Removed ${floating.length} npm ${floating.length === 1 ? "package" : "packages"}`,
    );
  } else {
    log.info("No npm packages to uninstall");
  }

  // Re-query installed packages after removal so diffs are accurate
  const currentResult = await listGlobalPackages();
  if (currentResult.isErr()) {
    return err(currentResult.error);
  }
  const currentMap = new Map(
    currentResult.value.map((p) => [p.name, p.version]),
  );
  const currentNames = new Set(currentMap.keys());

  // Diff: packages to install (in config but not installed)
  const toInstall = npmConfig.packages.filter((p) => !currentNames.has(p));

  // Diff: packages to upgrade (in config and already installed)
  const toUpgrade = npmConfig.packages.filter((p) => currentNames.has(p));

  // Install missing packages
  if (toInstall.length > 0) {
    log.step(pc.bold("Installing new npm packages"));

    const lines: string[] = [];
    for (const pkg of toInstall) {
      const result = await execa({
        reject: false,
      })`npm install -g ${pkg}`;

      if (result.exitCode !== 0) {
        return err(
          new Error(
            `npm install failed with exit code ${result.exitCode}: npm install -g ${pkg}`,
          ),
        );
      }

      const version = await getPackageVersion(pkg);
      lines.push(`- ${pkg} ${pc.gray(version)}`);
    }

    log.info(lines.join("\n"));
    log.success(
      `Installed ${toInstall.length} new npm ${toInstall.length === 1 ? "package" : "packages"}`,
    );
  }

  // Upgrade existing packages
  if (toUpgrade.length > 0) {
    log.step(pc.bold("Upgrading existing npm packages"));

    const lines: string[] = [];
    let upgraded = 0;
    for (const pkg of toUpgrade) {
      const before = currentMap.get(pkg) ?? "unknown";

      const result = await execa({
        reject: false,
      })`npm update -g ${pkg}`;

      if (result.exitCode !== 0) {
        return err(
          new Error(
            `npm update failed with exit code ${result.exitCode}: npm update -g ${pkg}`,
          ),
        );
      }

      const after = await getPackageVersion(pkg);

      if (before !== after) {
        lines.push(`- ${pkg} ${pc.gray(before)} → ${pc.gray(after)}`);
        upgraded++;
      } else {
        lines.push(`- ${pkg} ${pc.gray(before)}`);
      }
    }

    log.info(lines.join("\n"));
    if (upgraded > 0) {
      log.success(
        `Upgraded ${upgraded} npm ${upgraded === 1 ? "package" : "packages"}`,
      );
    } else {
      log.success("All npm packages already at latest");
    }
  }

  if (toInstall.length === 0 && toUpgrade.length === 0) {
    log.info("All npm packages up to date");
  }

  return ok(undefined);
}
