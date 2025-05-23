import { $ } from "bun";

function createEnv(brewfilePath: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  env.HOMEBREW_BUNDLE_FILE = brewfilePath;

  return env;
}

export async function listCasks(brewfilePath: string): Promise<string[]> {
  try {
    const result = await $`brew bundle list --casks`
      .env(createEnv(brewfilePath))
      .quiet();
    return result.text().trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function listFormulae(brewfilePath: string): Promise<string[]> {
  try {
    const result = await $`brew bundle list --brews`
      .env(createEnv(brewfilePath))
      .quiet();
    return result.text().trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function listTaps(brewfilePath: string): Promise<string[]> {
  try {
    const result = await $`brew bundle list --taps`
      .env(createEnv(brewfilePath))
      .quiet();
    return result.text().trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function listFloatingDependencies(
  brewfilePath: string
): Promise<string[]> {
  try {
    const result = await $`brew bundle cleanup`
      .env(createEnv(brewfilePath))
      .quiet()
      .nothrow(); // Needed as if packages to uninstall, then non-zero exit code returned.

    const output = result.text().trim();

    // If empty output or explicitly says nothing to uninstall, return empty array
    if (!output || output === "") {
      return [];
    }

    const packages: string[] = [];
    const lines = output.split("\n");

    let isPackageSection = false;
    for (const line of lines) {
      // Check if we're entering a package listing section.
      if (line.startsWith("Would uninstall")) {
        isPackageSection = true;
        continue;
      }

      // Check if we've hit the end of package listings.
      if (line.startsWith("Run `brew bundle cleanup")) {
        break;
      }

      // If we're in a package section, parse the packages, splitting by whitespace to handle
      // multiple packages per line.
      if (isPackageSection && line.trim()) {
        const items = line.trim().split(/\s+/);
        packages.push(...items);
      }
    }

    return packages;
  } catch {
    return [];
  }
}

export async function forceCleanup(brewfilePath: string): Promise<void> {
  await $`brew bundle --force cleanup`.env(createEnv(brewfilePath));
}

export async function install(brewfilePath: string): Promise<void> {
  await $`brew bundle install`.env(createEnv(brewfilePath));
}

export async function check(brewfilePath: string): Promise<boolean> {
  try {
    await $`brew bundle check`.env(createEnv(brewfilePath)).quiet();
    return true;
  } catch {
    return false;
  }
}
