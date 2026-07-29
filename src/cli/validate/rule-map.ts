import { RULE_MAP_A11Y } from "@/cli/validate/rule-map-a11y.js";
import { RULE_MAP_INVARIANTS } from "@/cli/validate/rule-map-invariants.js";
import { RULE_MAP_MOTION } from "@/cli/validate/rule-map-motion.js";

export const RULE_MAP: Record<
  string,
  { code: string; invariants: string[]; fixHint: string; cause: string }
> = {
  ...RULE_MAP_INVARIANTS,
  ...RULE_MAP_MOTION,
  ...RULE_MAP_A11Y,
};
