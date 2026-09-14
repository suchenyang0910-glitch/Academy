// Shared contracts contain no provider configuration or credentials.
export const ENGLISH_SCENARIOS = {
  introduction: { label: "Self introduction", role: "a friendly new colleague", opening: "Hi! I'm Alex, your new colleague. What would you like me to call you?", hint: "Hi Alex! My name is … I work in …" },
  restaurant: { label: "Ordering food", role: "a waiter taking a food order", opening: "Welcome! What would you like to eat today?", hint: "I'd like …, please. Could I also have …?" },
  daily: { label: "Daily conversation", role: "a friend asking about everyday life", opening: "Hi! How has your day been so far?", hint: "My day has been … Today I …" },
  colleague: { label: "Confirming a work task", role: "a colleague asking for an updated design by email; practise confirming the task, recipient and deadline, repeat or rephrase when asked", opening: "Hi! Could you send me the updated design?", hint: "Sure. When do you need it? / Could you say that again, please?" },
} as const;
export type EnglishScenario = keyof typeof ENGLISH_SCENARIOS;
export const ENGLISH_LEVELS = ["beginner", "basic", "intermediate"] as const;
export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];
export const MAX_ENGLISH_TURNS = 12;
export const MIN_ENGLISH_TURNS = 3;
export const MAX_ENGLISH_MESSAGE = 1000;
export type EnglishMessage = { role: "assistant" | "user"; content: string; inputMode?: "text" | "speech" };
export type EnglishFeedback = {
  strength: string;
  corrections: Array<{ original: string; improved: string; reason: string }>;
  practice: string;
};
export type EnglishSession = {
  id: string;
  lessonId: string;
  scenario: EnglishScenario;
  level: EnglishLevel;
  status: "active" | "completed";
  messages: EnglishMessage[];
  feedback: EnglishFeedback | null;
  version: number;
  createdAt: string;
  provider: string | null;
};

export type EnglishAction =
  | { action: "start"; lessonId: string; scenario: EnglishScenario; level: EnglishLevel; requestId: string }
  | { action: "reply"; sessionId: string; requestId: string; version: number; text: string; inputMode: "text" | "speech" }
  | { action: "finish"; sessionId: string; requestId: string; version: number };

export function parseEnglishAction(value: unknown): EnglishAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  if (typeof p.requestId !== "string" || !/^[a-zA-Z0-9_-]{16,80}$/.test(p.requestId)) return null;
  if (p.action === "start") {
    if (typeof p.lessonId !== "string" || p.lessonId.length > 100 || !p.lessonId ||
      typeof p.scenario !== "string" || !Object.hasOwn(ENGLISH_SCENARIOS, p.scenario) ||
      !ENGLISH_LEVELS.includes(p.level as EnglishLevel)) return null;
    return { action: "start", lessonId: p.lessonId, scenario: p.scenario as EnglishScenario, level: p.level as EnglishLevel, requestId: p.requestId };
  }
  if ((p.action !== "reply" && p.action !== "finish") || typeof p.sessionId !== "string" ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(p.sessionId) || !Number.isSafeInteger(p.version) || Number(p.version) < 0) return null;
  const base = { sessionId: p.sessionId, requestId: p.requestId, version: Number(p.version) };
  if (p.action === "finish") return { action: "finish", ...base };
  if (typeof p.text !== "string" || !p.text.trim() || p.text.length > MAX_ENGLISH_MESSAGE ||
    (p.inputMode !== "text" && p.inputMode !== "speech")) return null;
  return { action: "reply", ...base, text: p.text.trim(), inputMode: p.inputMode };
}

export function parseEnglishModelOutput(raw: string, finish: boolean, messages: EnglishMessage[]) {
  if (!finish && !raw.trim().startsWith("{") && !raw.trim().startsWith("```")) {
    const reply = raw.trim();
    return reply && reply.length <= 1200 ? { reply } : null;
  }
  try {
    const value = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
    const valid = (s: unknown, max: number): s is string => typeof s === "string" && s.trim().length > 0 && s.length <= max;
    if (!finish) return valid(value.reply, 1200) ? { reply: value.reply.trim() } : null;
    if (!valid(value.strength, 400) || !valid(value.practice, 400) || !Array.isArray(value.corrections) || value.corrections.length > 2) return null;
    const userTexts = messages.filter(m => m.role === "user").map(m => m.content);
    for (const c of value.corrections) {
      if (!c || !valid(c.original, 1000) || !valid(c.improved, 1000) || !valid(c.reason, 400) ||
        !userTexts.some(text => text.includes(c.original))) return null;
    }
    const feedback: EnglishFeedback = { strength: value.strength.trim(), practice: value.practice.trim(),
      corrections: value.corrections.map((c: EnglishFeedback["corrections"][number]) => ({ original: c.original, improved: c.improved, reason: c.reason })) };
    return { feedback };
  } catch { return null; }
}
