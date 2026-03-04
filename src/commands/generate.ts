import { confirm, intro, isCancel, log, outro } from "@clack/prompts";
import { err, ok, type Result } from "neverthrow";
import pc from "picocolors";
import { findDuplicates, generateBrewfile } from "../services/brewfile";
import { formatConfig } from "../services/format";
import type { Command } from "../types/command";
import { getConfig } from "../utils/config";

type GenerateOptions = {
  machine?: string;
};

const action: (options: GenerateOptions) => Promise<Result<void, Error>> =
  async (options) => {
    intro(pc.bgGreen(pc.bold("hops")));
    log.step(pc.bold("Reading hops.yml"));

    if (!options.machine) {
      return err(new Error("Machine flag is required"));
    }
    if (options.machine === "shared") {
      return err(new Error("Machine flag not allowed: shared"));
    }

    const configResult = await getConfig();
    if (configResult.isErr()) {
      return err(configResult.error);
    }
    const { config, version, path } = configResult.value;

    log.info(
      [
        "Docs: https://github.com/revett/hops",
        `Version: v${version}`,
        `Config: ${path}`,
        `Machine: ${options.machine}`,
      ].join("\n"),
    );

    log.step(pc.bold("Formatting"));
    const formatResult = await formatConfig(path);
    if (formatResult.isErr()) {
      return err(formatResult.error);
    }

    if (formatResult.value) {
      log.success("Fixed formatting issues");
    } else {
      log.success("No formatting issues");
    }

    const duplicates = findDuplicates(config.machines);
    if (duplicates.length > 0) {
      log.warn(pc.bold("Duplicates found in hops.yml"));
      log.info(duplicates.map((d) => `- ${d}`).join("\n"));

      const shouldContinue = await confirm({
        message: "Continue?",
      });

      if (isCancel(shouldContinue) || !shouldContinue) {
        log.error(pc.bold("Exiting early"));
        process.exit(0);
      }
    }

    const generate = await generateBrewfile(
      config,
      options.machine,
      version,
      path,
    );
    if (generate.isErr()) {
      return err(generate.error);
    }

    outro(pc.bold("Done"));
    return ok(undefined);
  };

export const generate = {
  name: "generate",
  description: "Generate Brewfile using hops.yml",
  options: [
    {
      flags: "--machine <machine>",
      description: "Which machine to generate the Brewfile for",
    },
  ],
  action,
} satisfies Command<GenerateOptions>;
