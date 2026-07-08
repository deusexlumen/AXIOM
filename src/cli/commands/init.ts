import type { InitResult } from "@/cli/types.js";
import { result } from "@/cli/utils/ndjson.js";

export async function init(name: string): Promise<void> {
  const out: InitResult = {
    ok: true,
    created: [name],
    next: "axm add component <Name>",
  };
  result(out);
}
