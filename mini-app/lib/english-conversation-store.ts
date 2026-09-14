import { randomUUID } from "node:crypto";
import { getD1 } from "../db";
import { assertLearningAccess, getLessonItem, type AcademyIdentity } from "./academy-store";
import { getAiRuntimeStatus } from "./ai-feedback";
import { requestEnglishConversation } from "./english-conversation-ai";
import { ENGLISH_SCENARIOS, MAX_ENGLISH_TURNS, MIN_ENGLISH_TURNS, type EnglishAction, type EnglishSession } from "./english-conversation";

type Row = { id: string; lesson_id: string; scenario: EnglishSession["scenario"]; level: EnglishSession["level"]; status: EnglishSession["status"]; messages_json: string; feedback_json: string | null; version: number; created_at: string; provider: string | null; last_request_id: string | null };
const fail = (error: string, status: number): never => { throw Response.json({ error }, { status }); };
function sessionFrom(row: Row): EnglishSession {
  return { id: row.id, lessonId: row.lesson_id, scenario: row.scenario, level: row.level, status: row.status,
    messages: JSON.parse(row.messages_json), feedback: row.feedback_json ? JSON.parse(row.feedback_json) : null,
    version: row.version, createdAt: row.created_at, provider: row.provider };
}

async function lessonFor(identity: AcademyIdentity, lessonId: string, write: boolean) {
  const item = await getLessonItem(identity, lessonId);
  if (item.enrollment.courseId !== "english") fail("english_lesson_required", 400);
  const lesson = item.lesson as Record<string, unknown>;
  if (write && (item.enrollment.active !== 1 || !Number.isFinite(Number(lesson.day)) || Number(lesson.day) > item.enrollment.currentDay)) fail("lesson_locked", 403);
  return item;
}

export async function listEnglishConversations(identity: AcademyIdentity, lessonId: string) {
  await lessonFor(identity, lessonId, false);
  const rows = await getD1().prepare("SELECT * FROM english_conversations WHERE user_id = ? AND lesson_id = ? ORDER BY created_at DESC LIMIT 10").bind(identity.id, lessonId).all<Row>();
  return { sessions: rows.results.map(sessionFrom), aiEnabled: getAiRuntimeStatus().enabled };
}

async function reserveRequest(userId: string) {
  // Atomic, durable per-user UTC-day budget, including failed provider calls.
  const result = await getD1().prepare(`INSERT INTO english_conversation_usage (user_id, day_key, requests) VALUES (?, ?, 1)
    ON CONFLICT (user_id, day_key) DO UPDATE SET requests = english_conversation_usage.requests + 1
    WHERE english_conversation_usage.requests < 60 RETURNING requests`).bind(userId, new Date().toISOString().slice(0, 10)).first();
  if (!result) fail("daily_limit", 429);
}

export async function updateEnglishConversation(identity: AcademyIdentity, action: EnglishAction) {
  await assertLearningAccess(identity);
  const db = getD1();
  if (action.action === "start") {
    await lessonFor(identity, action.lessonId, true);
    const existing = await db.prepare("SELECT * FROM english_conversations WHERE user_id = ? AND start_request_id = ?").bind(identity.id, action.requestId).first<Row>();
    if (existing) return sessionFrom(existing);
    if (!getAiRuntimeStatus().enabled) fail("ai_unavailable", 503);
    await reserveRequest(identity.id);
    const now = new Date().toISOString();
    const messages = [{ role: "assistant", content: ENGLISH_SCENARIOS[action.scenario].opening }];
    await db.prepare(`INSERT INTO english_conversations (id, user_id, lesson_id, scenario, level, messages_json, start_request_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, start_request_id) DO NOTHING`)
      .bind(randomUUID(), identity.id, action.lessonId, action.scenario, action.level, JSON.stringify(messages), action.requestId, now, now).run();
    const row = await db.prepare("SELECT * FROM english_conversations WHERE user_id = ? AND start_request_id = ?").bind(identity.id, action.requestId).first<Row>();
    return sessionFrom(row!);
  }
  const row = await db.prepare("SELECT * FROM english_conversations WHERE id = ? AND user_id = ?").bind(action.sessionId, identity.id).first<Row>();
  if (!row) return fail("session_not_found", 404);
  const lesson = await lessonFor(identity, row.lesson_id, true);
  if (row.last_request_id === action.requestId) return sessionFrom(row);
  if (row.status !== "active" || row.version !== action.version) return fail("session_changed", 409);
  const session = sessionFrom(row);
  const turns = session.messages.filter(m => m.role === "user").length;
  if (action.action === "reply" && turns >= MAX_ENGLISH_TURNS) fail("turn_limit", 409);
  if (action.action === "finish" && turns < MIN_ENGLISH_TURNS) fail("more_turns_needed", 400);
  const lock = randomUUID();
  const claimed = await db.prepare(`UPDATE english_conversations SET lock_token = ?, lock_until = ?
    WHERE id = ? AND user_id = ? AND version = ? AND status = 'active' AND lock_until < ? RETURNING id`)
    .bind(lock, Date.now() + 90_000, row.id, identity.id, row.version, Date.now()).first();
  if (!claimed) return fail("session_busy", 409);
  try {
    await reserveRequest(identity.id);
    if (action.action === "reply") session.messages.push({ role: "user", content: action.text, inputMode: action.inputMode });
    const locale = await db.prepare("SELECT ui_locale FROM users WHERE id = ?").bind(identity.id).first<{ ui_locale: string }>();
    const result = await requestEnglishConversation(session, String((lesson.lesson as Record<string, unknown>).objective), locale?.ui_locale || "zh-Hans", action.action === "finish");
    if (result.reply) session.messages.push({ role: "assistant", content: result.reply });
    const saved = await db.prepare(`UPDATE english_conversations SET messages_json = ?, feedback_json = ?, status = ?, provider = ?,
      version = version + 1, last_request_id = ?, lock_token = NULL, lock_until = 0, updated_at = ?
      WHERE id = ? AND user_id = ? AND lock_token = ? RETURNING *`)
      .bind(JSON.stringify(session.messages), result.feedback ? JSON.stringify(result.feedback) : null,
        action.action === "finish" ? "completed" : "active", result.provider, action.requestId, new Date().toISOString(), row.id, identity.id, lock).first<Row>();
    if (!saved) return fail("session_changed", 409);
    return sessionFrom(saved);
  } finally {
    await db.prepare("UPDATE english_conversations SET lock_token = NULL, lock_until = 0 WHERE id = ? AND user_id = ? AND lock_token = ?").bind(row.id, identity.id, lock).run();
  }
}
