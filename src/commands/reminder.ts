import { type Result, err, ok } from "neverthrow";
import pc from "picocolors";
import type { Command } from "../types/command";
import { getConfig, getLastApplyTime } from "../utils/config";

const defaultReminder = 7; // Defaults to reminding when over 7 days

const action: () => Promise<Result<void, Error>> = async () => {
  const configResult = await getConfig();
  if (configResult.isErr()) {
    // If config doesn't exist, don't show reminder
    return ok(undefined);
  }
  const { config } = configResult.value;

  const lastApplyResult = await getLastApplyTime();
  if (lastApplyResult.isErr()) {
    return err(lastApplyResult.error);
  }

  const lastApply = lastApplyResult.value;
  const reminderDays = config.reminder ?? defaultReminder;
  const reminderMs = reminderDays * 24 * 60 * 60 * 1000;

  // Apply command has never been run before, so return early
  if (!lastApply) {
    return ok(undefined);
  }

  const timeSinceLastApply = Date.now() - lastApply.getTime();
  if (timeSinceLastApply >= reminderMs) {
    const daysSince = Math.floor(timeSinceLastApply / (24 * 60 * 60 * 1000));
    console.log(
      pc.yellow(
        `🍺 hops → ${daysSince} day${daysSince === 1 ? "" : "s"} since last apply`,
      ),
    );
  }

  return ok(undefined);
};

export const reminder = {
  name: "reminder",
  description: "Check if time to run apply command",
  action,
} satisfies Command;
