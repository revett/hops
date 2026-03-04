import { readFile, writeFile } from "node:fs/promises";
import { err, ok, type Result } from "neverthrow";
import YAML, { isMap, isScalar, isSeq, type YAMLMap, type YAMLSeq } from "yaml";

const TOP_LEVEL_ORDER = ["brewfile", "reminder", "machines"];
const MACHINE_SECTION_ORDER = ["taps", "formulae", "casks", "cursor"];

/**
 * Sort a YAMLMap's items by a predefined key order. Keys not in the order list
 * are appended at the end in their original order.
 */
const sortMapByOrder = (map: YAMLMap, order: string[]): void => {
  const sorted = [];
  const remaining = [];

  for (const key of order) {
    const pair = map.items.find(
      (p) => isScalar(p.key) && String(p.key.value) === key,
    );
    if (pair) {
      sorted.push(pair);
    }
  }

  for (const pair of map.items) {
    const keyStr = isScalar(pair.key) ? String(pair.key.value) : "";
    if (!order.includes(keyStr)) {
      remaining.push(pair);
    }
  }

  map.items = [...sorted, ...remaining];
};

/**
 * Sort a YAMLMap's items alphabetically, with an optional key pinned first.
 */
const sortMapAlphabetically = (map: YAMLMap, pinFirst?: string): void => {
  const pinned = [];
  const rest = [];

  for (const pair of map.items) {
    const keyStr = isScalar(pair.key) ? String(pair.key.value) : "";
    if (pinFirst && keyStr === pinFirst) {
      pinned.push(pair);
    } else {
      rest.push(pair);
    }
  }

  rest.sort((a, b) => {
    const aKey = isScalar(a.key) ? String(a.key.value) : "";
    const bKey = isScalar(b.key) ? String(b.key.value) : "";
    return aKey.localeCompare(bKey);
  });

  map.items = [...pinned, ...rest];
};

/**
 * Sort a YAMLSeq's items alphabetically by scalar value.
 */
const sortSeqAlphabetically = (seq: YAMLSeq): void => {
  seq.items.sort((a, b) => {
    const aVal = isScalar(a) ? String(a.value) : "";
    const bVal = isScalar(b) ? String(b.value) : "";
    return aVal.localeCompare(bVal);
  });
};

/**
 * Format the hops.yml config file in place.
 *
 * Applies consistent ordering and 2-space indentation while preserving
 * comments attached to nodes.
 */
export const formatConfig = async (
  path: string,
): Promise<Result<boolean, Error>> => {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new Error(`Reading config for formatting: ${msg}`));
  }

  const doc = YAML.parseDocument(raw);
  const root = doc.contents;

  if (!isMap(root)) {
    return err(new Error("Config root is not a YAML map"));
  }

  // Sort top-level keys: brewfile, reminder, machines
  sortMapByOrder(root, TOP_LEVEL_ORDER);

  // Sort machines: shared first, then A-Z
  const machines = root.get("machines", true);
  if (isMap(machines)) {
    sortMapAlphabetically(machines, "shared");

    // Within each machine, sort sections and their items
    for (const pair of machines.items) {
      if (!isMap(pair.value)) {
        continue;
      }

      const machineMap = pair.value as YAMLMap;
      sortMapByOrder(machineMap, MACHINE_SECTION_ORDER);

      for (const sectionPair of machineMap.items) {
        if (isSeq(sectionPair.value)) {
          sortSeqAlphabetically(sectionPair.value);
        }
      }
    }
  }

  const formatted = doc.toString({ indent: 2 });
  const changed = formatted !== raw;

  if (changed) {
    try {
      await writeFile(path, formatted, "utf8");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return err(new Error(`Writing formatted config: ${msg}`));
    }
  }

  return ok(changed);
};
