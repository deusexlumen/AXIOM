import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { DirectionJson } from "@/cli/schemas/direction.js";
import { hashFile } from "@/cli/manifest/hash.js";

export async function freezeDirection(cwd: string, direction: DirectionJson, directionId: string): Promise<void> {
  const targetPath = resolve(cwd, "DIRECTION.axm.json");
  direction.directionId = directionId;
  await writeFile(targetPath, `${JSON.stringify(direction, null, 2)}\n`, "utf-8");

  const context = await readContext(cwd);
  context.direction = {
    file: "DIRECTION.axm.json",
    hash: await hashFile(targetPath),
    frozenAt: new Date().toISOString(),
  };
  context.integrity.machineFiles["DIRECTION.axm.json"] = await hashFile(targetPath);
  await writeContext(cwd, context);
}
