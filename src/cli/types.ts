export enum ExitCode {
  OK = 0,
  VALIDATION_ERROR = 10,
  TYPE_ERROR = 20,
  TEST_ERROR = 30,
  BUDGET_ERROR = 40,
  INTERNAL_ERROR = 50,
  OWNERSHIP_ERROR = 60,
}

export type NdjsonLine =
  | { type: "log"; message: string }
  | { type: "progress"; stage: string; done: boolean }
  | { type: "result"; ok: boolean; data: unknown };

export interface InitResult {
  ok: true;
  created: string[];
  next: "axm add component <Name>";
}
