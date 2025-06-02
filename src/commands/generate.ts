import { intro, log } from "@clack/prompts";
import { type Result, err, ok } from "neverthrow";
import pc from "picocolors";
import { generateBrewfile } from "../services/brewfile";
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
        `Version: v${version}`,
        `Config: ${path}`,
        `Machine: ${options.machine}`,
      ].join("\n"),
    );

    const generate = await generateBrewfile(
      config,
      options.machine,
      version,
      path,
    );
    if (generate.isErr()) {
      return err(generate.error);
    }

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
