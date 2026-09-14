import type { ListeningStage } from "./english-listening";
import type { ListeningSupportType } from "./english-listening-material";

const stages = new Set<ListeningStage>(["ready", "listen", "answer", "feedback", "explain", "transfer", "summary"]);
const supportTypes = new Set<ListeningSupportType>(["replay", "slow_audio", "line_audio", "glossary_opened", "transcript_opened", "translation_opened", "feedback_opened"]);
const requestId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{16,80}$/.test(value);
const id = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const version = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
function answers(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > 6 || entries.some(([key, answer]) => !id(key) || !id(answer))) return null;
  return Object.fromEntries(entries) as Record<string, string>;
}
function only(value: Record<string, unknown>, allowed: string[]) { return Object.keys(value).every((key) => allowed.includes(key)); }

export type ListeningAction =
  | { action: "start"; lessonId: string; materialId: string; mode: "practice" | "transfer" | "review"; requestId: string }
  | { action: "save"; sessionId: string; version: number; answersDraft: Record<string, string>; stage: ListeningStage; requestId: string }
  | { action: "event"; sessionId: string; version: number; eventType: ListeningSupportType | "audio_completed" | "audio_failed"; itemId?: string; requestId: string }
  | { action: "submit"; sessionId: string; version: number; answers: Record<string, string>; requestId: string }
  | { action: "finish"; sessionId: string; version: number; reflection?: string; requestId: string };

export function parseListeningAction(value: unknown): ListeningAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  if (!requestId(p.requestId)) return null;
  if (p.action === "start") {
    if (!only(p, ["action", "lessonId", "materialId", "mode", "requestId"])) return null;
    if (!id(p.lessonId) || !id(p.materialId) || !["practice", "transfer", "review"].includes(String(p.mode))) return null;
    return { action: "start", lessonId: p.lessonId, materialId: p.materialId, mode: p.mode as "practice" | "transfer" | "review", requestId: p.requestId };
  }
  if (!["save", "event", "submit", "finish"].includes(String(p.action)) || !id(p.sessionId) || !version(p.version)) return null;
  const base = { sessionId: p.sessionId, version: p.version, requestId: p.requestId };
  if (p.action === "save") {
    if (!only(p, ["action", "sessionId", "version", "answersDraft", "stage", "requestId"])) return null;
    const draft = answers(p.answersDraft);
    if (!draft || !stages.has(p.stage as ListeningStage)) return null;
    return { action: "save", ...base, answersDraft: draft, stage: p.stage as ListeningStage };
  }
  if (p.action === "event") {
    if (!only(p, ["action", "sessionId", "version", "eventType", "itemId", "requestId"])) return null;
    const eventType = p.eventType;
    if (eventType !== "audio_completed" && eventType !== "audio_failed" && !supportTypes.has(eventType as ListeningSupportType)) return null;
    if (p.itemId !== undefined && !id(p.itemId)) return null;
    return { action: "event", ...base, eventType: eventType as ListeningSupportType | "audio_completed" | "audio_failed", ...(typeof p.itemId === "string" ? { itemId: p.itemId } : {}) };
  }
  if (p.action === "submit") { if (!only(p, ["action", "sessionId", "version", "answers", "requestId"])) return null; const submitted = answers(p.answers); return submitted ? { action: "submit", ...base, answers: submitted } : null; }
  if (!only(p, ["action", "sessionId", "version", "reflection", "requestId"])) return null;
  if (p.reflection !== undefined && (typeof p.reflection !== "string" || p.reflection.length > 600)) return null;
  return { action: "finish", ...base, ...(typeof p.reflection === "string" ? { reflection: p.reflection.trim() } : {}) };
}
