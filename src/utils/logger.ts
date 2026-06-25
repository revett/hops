import { appendFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import {
  intro as clackIntro,
  log as clackLog,
  outro as clackOutro,
} from "@clack/prompts";

const FILE = resolve(`${homedir()}/.hops.log`);

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI codes start with the ESC control character by definition.
const ANSI = /\x1B\[[0-9;]*m/g;

let on = true;
let warned = false;

const write = (text: string): void => {
  if (!on) {
    return;
  }

  try {
    appendFileSync(FILE, `${text.replace(ANSI, "")}\n`);
  } catch {
    if (!warned) {
      warned = true;
      process.stderr.write(`hops: unable to write log file at ${FILE}\n`);
    }
  }
};

const reset = (header: string | null): void => {
  try {
    if (header === null) {
      rmSync(FILE, { force: true });
    } else {
      writeFileSync(FILE, header);
    }
  } catch {
    on = false;
  }
};

export const init = (): void => {
  on = true;
  const argv = process.argv.slice(2).join(" ");
  reset(`=== hops ${argv} | ${new Date().toISOString()} ===\n`);
};

export const configure = (enabled: boolean): void => {
  on = enabled;
  if (!enabled) {
    reset(null);
  }
};

export const log = {
  step: (message: string): void => {
    clackLog.step(message);
    write(message);
  },
  info: (message: string): void => {
    clackLog.info(message);
    write(message);
  },
  success: (message: string): void => {
    clackLog.success(message);
    write(message);
  },
  warn: (message: string): void => {
    clackLog.warn(message);
    write(message);
  },
  error: (message: string): void => {
    clackLog.error(message);
    write(message);
  },
};

export const intro = (message: string): void => {
  clackIntro(message);
  write(message);
};

export const outro = (message: string): void => {
  clackOutro(message);
  write(message);
};

export const output = (message: string): void => {
  console.log(message);
  write(message);
};

export const capture = (text: string): void => {
  write(text);
};

export const status = (): string => (on ? FILE : "disabled");
