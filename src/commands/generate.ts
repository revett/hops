import { generateBrewfile } from "../services/brewfile";
import type { Command } from "../types/command";
import { getConfig } from "../utils/config";

type GenerateOptions = {
  machine?: string;
};

const action: (options: GenerateOptions) => Promise<void> = async (options) => {
  if (!options.machine) {
    throw new Error("Machine flag is required");
  }
  if (options.machine === "shared") {
    throw new Error("Machine flag not allowed: shared");
  }

  console.log(`🖥️ Machine: ${options.machine}`);

  const config = await getConfig();
  await generateBrewfile(config, options.machine);
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
