import { execa } from "execa";

export type PackageType = "formula" | "cask";

export async function getPackageVersions(
  packages: string[],
  type: PackageType,
): Promise<Map<string, string>> {
  if (packages.length === 0) {
    return new Map();
  }

  const args =
    type === "cask"
      ? ["list", "--cask", "--versions", ...packages]
      : ["list", "--versions", ...packages];

  const result = await execa("brew", args, {
    lines: true,
    reject: false,
  });

  const versionMap = new Map<string, string>();

  if (result.exitCode !== 0) {
    return versionMap;
  }

  for (const line of result.stdout) {
    // matches a line that contains at least two parts separated by whitespace.
    const match = line.match(/^(\S+)\s+(.+)$/);
    if (match) {
      const name = match[1];
      const version = match[2];
      if (name && version) {
        versionMap.set(name, version);
      }
    }
  }

  return versionMap;
}
