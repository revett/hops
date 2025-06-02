import { constants } from "node:fs";
import { access } from "node:fs/promises";

export const fileExists = async (path: string): Promise<boolean> => {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
};
