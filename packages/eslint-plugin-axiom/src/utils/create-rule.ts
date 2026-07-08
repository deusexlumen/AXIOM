import type { Rule } from "eslint";

export interface AxiomRule {
  meta: Rule.RuleMetaData;
  create(context: Rule.RuleContext): Rule.NodeListener;
}

export function createRule(rule: AxiomRule): Rule.RuleModule {
  return rule as Rule.RuleModule;
}
