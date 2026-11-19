import { styleText } from "node:util";
import { formatConfig } from "../services/format";
import type { Command } from "../types/command";
import { getConfig, getConfigPath } from "../utils/config";
import { intro, log, outro, status } from "../utils/logger";
import { err, ok, type Result } from "../utils/result";
import { version } from "../utils/version";

const action: () => Promise<Result<void, Error>> = async () => {
  intro(styleText(["bgGreen", "bold"], "hops"));

  const configResult = await getConfig();
  const path = configResult.isOk() ? configResult.value.path : getConfigPath();

  log.info(
    [
      "Docs: https://github.com/revett/hops",
      `Version: v${version}`,
      `Config: ${path}`,
      `Logging: ${status()}`,
    ].join("\n"),
  );

  log.step(styleText("bold", "Formatting"));

  const result = await formatConfig(path);
  if (result.isErr()) {
    return err(result.error);
  }

  if (result.value) {
    log.success("Fixed formatting issues");
  } else {
    log.success("No formatting issues");
  }
  outro(styleText("bold", "Done"));
  return ok(undefined);
};

export const format = {
  name: "format",
  description: "Format hops.yml config file",
  action,
} satisfies Command;
