import pkg from "../../package.json" with { type: "json" };
import type { Package } from "../types/package";

const typedPkg = pkg as Package;
export const version: string = typedPkg.version;
