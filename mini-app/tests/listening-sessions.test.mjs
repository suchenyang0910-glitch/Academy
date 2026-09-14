import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import ts from "typescript";
import test from "node:test";

// Runs the real listening store against an isolated relational database. It
// verifies durable state and ownership without a Telegram identity or provider.
async function harness() {
  const root = resolve(import.meta.dirname, "..");
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY); CREATE TABLE lessons (id TEXT PRIMARY KEY);
    INSERT INTO users VALUES ('alice'), ('bob'); INSERT INTO lessons VALUES ('english-day-1');
    CREATE TABLE listening_sessions (id TEXT PRIMARY KEY, user_id TEXT, lesson_id TEXT, material_id TEXT, material_version TEXT, question_set_id TEXT, mode TEXT, stage TEXT, answers_draft_json TEXT, support_json TEXT, status TEXT DEFAULT 'active', version INTEGER DEFAULT 0, prior_exposure INTEGER DEFAULT 0, start_request_id TEXT, last_request_id TEXT, created_at TEXT, updated_at TEXT, completed_at TEXT, UNIQUE(user_id,start_request_id));
    CREATE TABLE listening_events (id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, request_id TEXT, sequence INTEGER, type TEXT, payload_json TEXT, created_at TEXT, UNIQUE(user_id,request_id));
    CREATE TABLE listening_attempts (id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, material_version TEXT, question_set_id TEXT, request_id TEXT, answers_json TEXT, correct_count INTEGER, question_count INTEGER, support_snapshot_json TEXT, prior_exposure INTEGER, submitted_at TEXT, UNIQUE(user_id,request_id));
    CREATE TABLE notes (id INTEGER PRIMARY KEY, user_id TEXT, lesson_id TEXT, content TEXT, created_at TEXT, updated_at TEXT);`);
  const adapter = { prepare(sql) { let values = []; return { bind(...next) { values = next; return this; }, async first() { return db.prepare(sql).get(...values) ?? null; }, async all() { return { results: db.prepare(sql).all(...values) }; }, async run() { const result = db.prepare(sql).run(...values); return { meta: { changes: result.changes, last_row_id: 0 } }; } }; } };
  const state = { access: true };
  const context = createContext({ Response, console, JSON, Date, Math, Object, Array, String, Number, Boolean, Set, crypto: globalThis.crypto });
  const mocks = {
    [join(root, "db.ts")]: { getD1: () => adapter },
    [join(root, "lib/academy-store.ts")]: {
      assertLearningAccess: async () => { if (!state.access) throw new Response("expired", { status: 402 }); },
      getLessonItem: async (identity, lessonId) => { if (lessonId !== "english-day-1" || identity.id !== "alice") throw new Response("missing", { status: 404 }); return { enrollment: { courseId: "english", active: 1, currentDay: 1 }, lesson: { day: 1 } }; },
    },
  };
  const cache = new Map();
  async function load(path) {
    if (cache.has(path)) return cache.get(path);
    if (mocks[path]) { const exports = mocks[path]; const mod = new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context, identifier: path }); cache.set(path, mod); return mod; }
    const source = await readFile(path, "utf8");
    const mod = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText, { context, identifier: path });
    cache.set(path, mod);
    await mod.link(async (specifier, referencing) => {
      if (specifier.startsWith("node:")) { const exports = await import(specifier); return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context }); }
      return load(resolve(dirname(referencing.identifier), `${specifier}.ts`));
    });
    return mod;
  }
  const store = await load(join(root, "lib/english-listening-store.ts")); await store.evaluate();
  return { db, state, store: store.namespace, alice: { id: "alice" }, bob: { id: "bob" } };
}
const id = (suffix) => `request_${suffix.padEnd(18, "x")}`;

test("listening sessions persist a server-scored practice and transfer result without course writes", async () => {
  const h = await harness();
  try {
    let result = await h.store.updateListeningSession(h.alice, { action: "start", lessonId: "english-day-1", materialId: "coffee", mode: "practice", requestId: id("start") });
    let session = result.session;
    assert.equal(result.material.questions[0].answerId, undefined);
    result = await h.store.updateListeningSession(h.alice, { action: "event", sessionId: session.id, version: session.version, eventType: "audio_completed", requestId: id("audio") }); session = result.session;
    result = await h.store.updateListeningSession(h.alice, { action: "save", sessionId: session.id, version: session.version, stage: "answer", answersDraft: { temperature: "iced", size: "small", place: "go", price: "three" }, requestId: id("save") }); session = result.session;
    result = await h.store.updateListeningSession(h.alice, { action: "submit", sessionId: session.id, version: session.version, answers: session.answersDraft, requestId: id("submit") }); session = result.session;
    assert.equal(result.feedback.correct, 4); assert.equal(session.stage, "feedback");
    result = await h.store.updateListeningSession(h.alice, { action: "save", sessionId: session.id, version: session.version, stage: "transfer", answersDraft: {}, requestId: id("transfer") }); session = result.session;
    result = await h.store.updateListeningSession(h.alice, { action: "submit", sessionId: session.id, version: session.version, answers: { "transfer-place": "here" }, requestId: id("transfer-submit") }); session = result.session;
    result = await h.store.updateListeningSession(h.alice, { action: "finish", sessionId: session.id, version: session.version, reflection: "模拟：我听懂了 for here。", requestId: id("finish") });
    assert.equal(result.session.status, "completed");
    assert.equal(h.db.prepare("SELECT COUNT(*) AS count FROM listening_attempts").get().count, 2);
    assert.equal(h.db.prepare("SELECT COUNT(*) AS count FROM notes").get().count, 1);
  } finally { h.db.close(); }
});

test("listening session actions enforce ownership, optimistic versions and request-id idempotency", async () => {
  const h = await harness();
  try {
    const start = { action: "start", lessonId: "english-day-1", materialId: "coffee", mode: "practice", requestId: id("same-start") };
    const first = await h.store.updateListeningSession(h.alice, start); const second = await h.store.updateListeningSession(h.alice, start);
    assert.equal(first.session.id, second.session.id);
    await assert.rejects(() => h.store.updateListeningSession(h.bob, { action: "event", sessionId: first.session.id, version: 0, eventType: "audio_completed", requestId: id("bob") }), (error) => error instanceof Response && error.status === 404);
    const updated = await h.store.updateListeningSession(h.alice, { action: "event", sessionId: first.session.id, version: 0, eventType: "audio_completed", requestId: id("event") });
    await assert.rejects(() => h.store.updateListeningSession(h.alice, { action: "save", sessionId: first.session.id, version: 0, stage: "answer", answersDraft: {}, requestId: id("stale") }), (error) => error instanceof Response && error.status === 409);
    const retry = await h.store.updateListeningSession(h.alice, { action: "event", sessionId: first.session.id, version: 0, eventType: "audio_completed", requestId: id("event") });
    assert.equal(retry.session.version, updated.session.version);
  } finally { h.db.close(); }
});
