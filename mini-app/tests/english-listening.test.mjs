import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule } from "node:vm";
import ts from "typescript";
import test from "node:test";

async function load(path, linker = () => { throw new Error("Unexpected dependency"); }) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const module = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  await module.link(linker); await module.evaluate(); return module.namespace;
}

test("reviewed listening material has 3–5 taught practice questions and a distinct transfer question", async () => {
  const material = await load("../lib/english-listening-material.ts");
  assert.equal(material.listeningMaterials.length, 2);
  for (const lesson of material.listeningMaterials) {
    assert.ok(lesson.questions.length >= 3 && lesson.questions.length <= 5);
    for (const question of lesson.questions) {
      assert.ok(lesson.lines.find((line) => line.id === question.lineId));
      assert.ok(question.options.some((option) => option.id === question.answerId));
      assert.ok(question.explanation.length > 4);
    }
    assert.ok(lesson.transfer.text);
    assert.ok(lesson.transfer.question.options.some((option) => option.id === lesson.transfer.question.answerId));
  }
});

test("the browser-facing material contract cannot expose answer keys or explanations", async () => {
  const material = await load("../lib/english-listening-material.ts");
  const browser = await load("../lib/english-listening.ts");
  const browserSource = await readFile(new URL("../lib/english-listening.ts", import.meta.url), "utf8");
  assert.doesNotMatch(browserSource, /english-listening-material/);
  for (const lesson of browser.listeningLessons) {
    assert.doesNotMatch(JSON.stringify(lesson), /answerId|explanation/);
    assert.ok(lesson.questions.every((question) => question.options.length >= 2));
  }
  assert.equal(browser.listeningLessons.length, material.listeningMaterials.length);
});

test("listening action parser accepts bounded valid actions and rejects client score injection", async () => {
  const module = await load("../lib/english-listening-actions.ts");
  const id = "a".repeat(20);
  assert.equal(module.parseListeningAction({ action: "start", lessonId: "english-day-1", materialId: "coffee", mode: "practice", requestId: id }).action, "start");
  assert.equal(module.parseListeningAction({ action: "submit", sessionId: id, version: 0, answers: { temperature: "iced" }, score: 100, requestId: id }), null);
  assert.equal(module.parseListeningAction({ action: "event", sessionId: id, version: 0, eventType: "transcript_opened", itemId: "l1", requestId: id }).action, "event");
});
