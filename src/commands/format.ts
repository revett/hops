import { intro, log, outro } from "@clack/prompts";
import { err, ok, type Result } from "neverthrow";
import pc from "picocolors";
import { formatConfig } from "../services/format";
import type { Command } from "../types/command";
import { getConfigPath } from "../utils/config";
import { version } from "../utils/version";

const action: () => Promise<Result<void, Error>> = async () => {
  intro(pc.bgGreen(pc.bold("hops")));

  const path = getConfigPath();

  log.info(
    [
      "Docs: https://github.com/revett/hops",
      `Version: v${version}`,
      `Config: ${path}`,
    ].join("\n"),
  );

  log.step(pc.bold("Formatting"));

  const result = await formatConfig(path);
  if (result.isErr()) {
    return err(result.error);
  }

  log.success(`Formatted: ${path}`);
  outro(pc.bold("Done"));
  return ok(undefined);
};

export const format = {
  name: "format",
  description: "Format hops.yml config file",
  action,
} satisfies Command;
