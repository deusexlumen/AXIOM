export interface ElicitationQuestion {
  id: string;
  field: string;
  prompt: string;
  required: boolean;
  type: "string" | "number" | "choice" | "array" | "urls";
  options?: string[];
}

export interface ElicitationRound {
  round: number;
  focus: string;
  maxQuestions: number;
  questions: ElicitationQuestion[];
}

export const ELICITATION_ROUNDS: ElicitationRound[] = [
  {
    round: 1,
    focus: "Track & Goal",
    maxQuestions: 2,
    questions: [
      {
        id: "track",
        field: "track",
        prompt: "Should this project follow Track A (CURATED signature patterns) or Track B (BESPOKE creative pipeline)?",
        required: true,
        type: "choice",
        options: ["curated", "bespoke"],
      },
      {
        id: "primary-goal",
        field: "goal.primary",
        prompt: "What is the primary goal of the site?",
        required: true,
        type: "choice",
        options: ["signup", "contact", "awareness", "portfolio"],
      },
    ],
  },
  {
    round: 2,
    focus: "Brand & Audience",
    maxQuestions: 2,
    questions: [
      {
        id: "brand-name",
        field: "brand.name",
        prompt: "What is the brand or project name?",
        required: true,
        type: "string",
      },
      {
        id: "brand-one-liner",
        field: "brand.oneLiner",
        prompt: "Describe the brand in one line.",
        required: true,
        type: "string",
      },
      {
        id: "audience-who",
        field: "audience.who",
        prompt: "Who is the primary audience?",
        required: true,
        type: "string",
      },
      {
        id: "device-bias",
        field: "audience.device",
        prompt: "Is the experience desktop-first, mobile-first, or balanced?",
        required: true,
        type: "choice",
        options: ["desktop-first", "mobile-first", "balanced"],
      },
    ],
  },
  {
    round: 3,
    focus: "References & Taste",
    maxQuestions: 2,
    questions: [
      {
        id: "reference-urls",
        field: "references",
        prompt: "Provide at least two reference site URLs and what you like/dislike about each.",
        required: true,
        type: "urls",
      },
      {
        id: "mood-words",
        field: "mood.words",
        prompt: "List 3–5 words that describe the desired mood.",
        required: true,
        type: "array",
      },
    ],
  },
  {
    round: 4,
    focus: "Content & Constraints",
    maxQuestions: 2,
    questions: [
      {
        id: "sections",
        field: "content.sections",
        prompt: "Which sections should the page contain?",
        required: true,
        type: "array",
      },
      {
        id: "webgl-appetite",
        field: "webglAppetite",
        prompt: "WebGL appetite on a scale of 0–3 (0 = none, 3 = heavy WebGL scenes).",
        required: true,
        type: "number",
      },
    ],
  },
];

export function allQuestions(): ElicitationQuestion[] {
  return ELICITATION_ROUNDS.flatMap((round) => round.questions);
}
