import { AssetOptions } from "@/cli/assets/types.js";
import { validationError } from "@/cli/assets/common.js";
import { addFont } from "@/cli/assets/font.js";
import { addImage } from "@/cli/assets/image.js";
import { addModel } from "@/cli/assets/model.js";

export { addFont, addImage, addModel, AssetOptions };

export async function runAssetsCommand(subcommand: string, path: string, options: AssetOptions = {}): Promise<void> {
  if (subcommand === "font") return addFont(path, options);
  if (subcommand === "image") return addImage(path, options);
  if (subcommand === "model") return addModel(path, options);
  validationError(`Unknown assets subcommand: ${subcommand}`);
}
