import { randomUUID } from "node:crypto";
import { getD1 } from "../db";
import { assertLearningAccess, getLessonItem, type AcademyIdentity } from "./academy-store";
import { type ListeningAction } from "./english-listening-actions";
import { findListeningMaterial, publicListeningMaterial, type ListeningMaterial, type ListeningSupportType } from "./english-listening-material";
import { stageIndex, type ListeningFeedback, type ListeningSession, type ListeningStage } from "./english-listening";

type Row = { id: string; lesson_id: string; material_id: string; material_version: string; question_set_id: string; mode: ListeningSession["mode"]; stage: ListeningStage; answers_draft_json: string; support_json: string; status: ListeningSession["status"]; version: number; prior_exposure: number; created_at: string; updated_at: string; completed_at: string | null; last_request_id: string | null };
const fail = (error: string, status: number): never => { throw Response.json({ error: { code: error, message: "英语练习暂时无法完成，请重试。" } }, { status }); };
function sessionFrom(row: Row): ListeningSession {
  return { id: row.id, lessonId: row.lesson_id, materialId: row.material_id, materialVersion: row.material_version, questionSetId: row.question_set_id, mode: row.mode, stage: row.stage, answersDraft: JSON.parse(row.answers_draft_json), support: JSON.parse(row.support_json), status: row.status, version: row.version, priorExposure: Number(row.prior_exposure) === 1, createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at };
}
async function lessonFor(identity: AcademyIdentity, lessonId: string, write: boolean) {
  const item = await getLessonItem(identity, lessonId);
  if (item.enrollment.courseId !== "english") fail("english_lesson_required", 400);
  const lesson = item.lesson as Record<string, unknown>;
  if (write && (item.enrollment.active !== 1 || Number(lesson.day) > item.enrollment.currentDay)) fail("lesson_locked", 403);
  return item;
}
function materialFor(id: string): ListeningMaterial { const material = findListeningMaterial(id, "v1"); if (!material) return fail("material_not_found", 404); return material; }
function validAnswers(material: ListeningMaterial, answers: Record<string, string>, transfer = false) {
  const questions = transfer ? [material.transfer.question] : material.questions;
  if (Object.keys(answers).length !== questions.length) return false;
  return questions.every((question) => answers[question.id] && question.options.some((option) => option.id === answers[question.id]));
}
async function rowFor(identity: AcademyIdentity, sessionId: string): Promise<Row> {
  const row = await getD1().prepare("SELECT * FROM listening_sessions WHERE id = ? AND user_id = ?").bind(sessionId, identity.id).first<Row>();
  if (!row) return fail("session_not_found", 404);
  await lessonFor(identity, row.lesson_id, true);
  return row;
}
function materialPayload(material: ListeningMaterial) { return publicListeningMaterial(material); }
function feedbackFor(material: ListeningMaterial, answers: Record<string, string>, transfer: boolean, priorExposure: boolean): ListeningFeedback {
  const questions = transfer ? [material.transfer.question] : material.questions;
  const explanations = transfer
    ? [material.transfer.question].map((question) => ({ questionId: question.id, correct: answers[question.id] === question.answerId, explanation: question.explanation }))
    : material.questions.map((question) => ({ questionId: question.id, correct: answers[question.id] === question.answerId, explanation: question.explanation, lineId: question.lineId }));
  return { correct: questions.filter((question) => answers[question.id] === question.answerId).length, total: questions.length, priorExposure, explanations };
}

export async function listListeningSessions(identity: AcademyIdentity, lessonId: string) {
  await lessonFor(identity, lessonId, false);
  const rows = await getD1().prepare("SELECT * FROM listening_sessions WHERE user_id = ? AND lesson_id = ? ORDER BY updated_at DESC LIMIT 20").bind(identity.id, lessonId).all<Row>();
  return { sessions: rows.results.map(sessionFrom) };
}
export async function getListeningSession(identity: AcademyIdentity, sessionId: string) {
  const row = await rowFor(identity, sessionId);
  const material = materialFor(row.material_id);
  const attempt = await getD1().prepare("SELECT answers_json, question_set_id, prior_exposure FROM listening_attempts WHERE session_id = ? ORDER BY submitted_at DESC LIMIT 1").bind(row.id).first<{ answers_json: string; question_set_id: string; prior_exposure: number }>();
  return { session: sessionFrom(row), material: materialPayload(material), ...(attempt ? { feedback: feedbackFor(material, JSON.parse(attempt.answers_json), attempt.question_set_id.endsWith(":transfer"), Number(attempt.prior_exposure) === 1) } : {}) };
}
export async function updateListeningSession(identity: AcademyIdentity, action: ListeningAction): Promise<Record<string, unknown>> {
  await assertLearningAccess(identity);
  const db = getD1();
  if (action.action === "start") {
    await lessonFor(identity, action.lessonId, true);
    const material = materialFor(action.materialId);
    const existing = await db.prepare("SELECT * FROM listening_sessions WHERE user_id = ? AND start_request_id = ?").bind(identity.id, action.requestId).first<Row>();
    if (existing) return { session: sessionFrom(existing), material: materialPayload(material) };
    const prior = await db.prepare("SELECT id FROM listening_attempts WHERE user_id = ? AND material_version = ? AND question_set_id = ? LIMIT 1").bind(identity.id, material.version, `${material.id}:practice`).first();
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO listening_sessions (id, user_id, lesson_id, material_id, material_version, question_set_id, mode, stage, answers_draft_json, support_json, prior_exposure, start_request_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', '{}', '{}', ?, ?, ?, ?) ON CONFLICT (user_id, start_request_id) DO NOTHING`)
      .bind(randomUUID(), identity.id, action.lessonId, material.id, material.version, `${material.id}:practice`, action.mode, prior ? 1 : 0, action.requestId, now, now).run();
    const row = await db.prepare("SELECT * FROM listening_sessions WHERE user_id = ? AND start_request_id = ?").bind(identity.id, action.requestId).first<Row>();
    return { session: sessionFrom(row!), material: materialPayload(material) };
  }
  const row = await rowFor(identity, action.sessionId);
  if (row.last_request_id === action.requestId) return { session: sessionFrom(row), material: materialPayload(materialFor(row.material_id)) };
  if (row.status !== "active" || row.version !== action.version) fail("session_changed", 409);
  const material = materialFor(row.material_id);
  const session = sessionFrom(row);
  if (action.action === "save") {
    if (stageIndex(action.stage) < stageIndex(session.stage) || stageIndex(action.stage) > stageIndex("transfer")) fail("invalid_stage", 400);
    const saved = await db.prepare(`UPDATE listening_sessions SET answers_draft_json = ?, stage = ?, version = version + 1, last_request_id = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND version = ? RETURNING *`).bind(JSON.stringify(action.answersDraft), action.stage, action.requestId, new Date().toISOString(), row.id, identity.id, row.version).first<Row>();
    if (!saved) return fail("session_changed", 409);
    return { session: sessionFrom(saved), material: materialPayload(material) };
  }
  if (action.action === "event") {
    const support = session.support as Partial<Record<ListeningSupportType | "audio_completed" | "audio_failed", number>>;
    support[action.eventType] = (support[action.eventType] ?? 0) + 1;
    const eventResult = await db.prepare(`INSERT INTO listening_events (id, user_id, session_id, request_id, sequence, type, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, request_id) DO NOTHING RETURNING id`).bind(randomUUID(), identity.id, row.id, action.requestId, Object.values(support).reduce((total, value) => total + value, 0) + 1, action.eventType, JSON.stringify(action.itemId ? { itemId: action.itemId } : {}), new Date().toISOString()).first();
    if (!eventResult) return { session, material: materialPayload(material) };
    const saved = await db.prepare(`UPDATE listening_sessions SET support_json = ?, stage = CASE WHEN stage = 'ready' THEN 'listen' ELSE stage END, version = version + 1, last_request_id = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND version = ? RETURNING *`).bind(JSON.stringify(support), action.requestId, new Date().toISOString(), row.id, identity.id, row.version).first<Row>();
    if (!saved) return fail("session_changed", 409);
    return { session: sessionFrom(saved), material: materialPayload(material) };
  }
  if (action.action === "submit") {
    const transfer = session.stage === "transfer";
    if (!transfer && (session.support as Record<string, number>).audio_completed < 1) fail("audio_required", 400);
    if (!validAnswers(material, action.answers, transfer)) fail("invalid_answers", 400);
    const questions = transfer ? [material.transfer.question] : material.questions;
    const feedback = feedbackFor(material, action.answers, transfer, session.priorExposure);
    const correct = feedback.correct;
    const nextStage: ListeningStage = transfer ? "summary" : "feedback";
    const now = new Date().toISOString();
    const attempt = await db.prepare(`INSERT INTO listening_attempts (id, user_id, session_id, material_version, question_set_id, request_id, answers_json, correct_count, question_count, support_snapshot_json, prior_exposure, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, request_id) DO NOTHING RETURNING id`).bind(randomUUID(), identity.id, row.id, material.version, transfer ? `${material.id}:transfer` : `${material.id}:practice`, action.requestId, JSON.stringify(action.answers), correct, questions.length, JSON.stringify(session.support), session.priorExposure ? 1 : 0, now).first();
    if (!attempt) {
      const duplicate = await db.prepare("SELECT * FROM listening_sessions WHERE id = ? AND user_id = ?").bind(row.id, identity.id).first<Row>();
      return { session: sessionFrom(duplicate!), material: materialPayload(material) };
    }
    const saved = await db.prepare(`UPDATE listening_sessions SET answers_draft_json = ?, stage = ?, version = version + 1, last_request_id = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND version = ? RETURNING *`).bind(JSON.stringify(action.answers), nextStage, action.requestId, now, row.id, identity.id, row.version).first<Row>();
    if (!saved) return fail("session_changed", 409);
    return { session: sessionFrom(saved), feedback, material: materialPayload(material) };
  }
  if (session.stage !== "summary") fail("finish_before_transfer", 400);
  const now = new Date().toISOString();
  if (action.reflection) await db.prepare("INSERT INTO notes (user_id, lesson_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").bind(identity.id, row.lesson_id, `[listening:${material.id}:${material.version}] ${action.reflection}`, now, now).run();
  const saved = await db.prepare(`UPDATE listening_sessions SET status = 'completed', completed_at = ?, version = version + 1, last_request_id = ?, updated_at = ?
    WHERE id = ? AND user_id = ? AND version = ? RETURNING *`).bind(now, action.requestId, now, row.id, identity.id, row.version).first<Row>();
  if (!saved) return fail("session_changed", 409);
  return { session: sessionFrom(saved), material: materialPayload(material) };
}
