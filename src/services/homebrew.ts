import { $ } from "bun";
import { Result, ok, err } from "neverthrow";

function createEnv(brewfilePath: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  env["HOMEBREW_BUNDLE_FILE"] = brewfilePath;

  return env;
}

export async function listTaps(
  brewfilePath: string
): Promise<Result<string[], Error>> {
  try {
    const result = await $`brew bundle list --taps`
      .env(createEnv(brewfilePath))
      .quiet();
    const taps = result.text().trim().split("\n").filter(Boolean);
    return ok(taps);
  } catch (error) {
    return err(
      new Error(
        `Listing taps: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}

export async function listFormulae(
  brewfilePath: string
): Promise<Result<string[], Error>> {
  try {
    const result = await $`brew bundle list --brews`
      .env(createEnv(brewfilePath))
      .quiet();
    const formulae = result.text().trim().split("\n").filter(Boolean);
    return ok(formulae);
  } catch (error) {
    return err(
      new Error(
        `Listing formulae: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}

export async function listCasks(
  brewfilePath: string
): Promise<Result<string[], Error>> {
  try {
    const result = await $`brew bundle list --casks`
      .env(createEnv(brewfilePath))
      .quiet();
    const casks = result.text().trim().split("\n").filter(Boolean);
    return ok(casks);
  } catch (error) {
    return err(
      new Error(
        `Listing casks: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}

export async function listFloatingDependencies(
  brewfilePath: string
): Promise<Result<string[], Error>> {
  try {
    const result = await $`brew bundle cleanup`
      .env(createEnv(brewfilePath))
      .quiet()
      .nothrow(); // Needed as if packages to uninstall, then non-zero exit code returned.

    const output = result.text().trim();

    // If empty output or explicitly says nothing to uninstall, return empty array
    if (!output || output === "") {
      return ok([]);
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

    return ok(packages);
  } catch (error) {
    return err(
      new Error(
        `Listing floating dependencies: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}

export async function forceCleanup(
  brewfilePath: string
): Promise<Result<void, Error>> {
  try {
    await $`brew bundle --force cleanup`.env(createEnv(brewfilePath));
    return ok(undefined);
  } catch (error) {
    return err(
      new Error(
        `Removing floating dependencies: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}

export async function install(
  brewfilePath: string
): Promise<Result<void, Error>> {
  try {
    await $`brew bundle install`.env(createEnv(brewfilePath));
    return ok(undefined);
  } catch (error) {
    return err(
      new Error(
        `Installing/updating packages: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}

export async function check(
  brewfilePath: string
): Promise<Result<boolean, Error>> {
  try {
    await $`brew bundle check`.env(createEnv(brewfilePath)).quiet();
    return ok(true);
  } catch (error) {
    return err(
      new Error(
        `Checking packages: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}
