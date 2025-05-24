import { Result, ok, err } from "neverthrow";
import { generateBrewfile } from "../services/brewfile";
import type { Command } from "../types/command";
import { getConfig } from "../utils/config";

type GenerateOptions = {
  machine?: string;
};

const action: (
  options: GenerateOptions
) => Promise<Result<void, Error>> = async (options) => {
  if (!options.machine) {
    return err(new Error("Machine flag is required"));
  }
  if (options.machine === "shared") {
    return err(new Error("Machine flag not allowed: shared"));
  }

  console.log(`🖥️ Machine: ${options.machine}`);

  const config = await getConfig();
  if (config.isErr()) {
    return err(config.error);
  }

  const generate = await generateBrewfile(config.value, options.machine);
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
