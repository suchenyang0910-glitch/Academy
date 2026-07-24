import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Academy product shell without starter content", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    access(new URL("../dist/server/index.js", import.meta.url)),
  ]);

  assert.match(layout, /Academy · 学习监督系统/);
  assert.match(page, /Academy Telegram Mini App/);
  assert.match(page, /学习监督系统/);
  assert.match(page, /正在整理今天的学习/);
  assert.doesNotMatch(page, /codex-preview|Your site is taking shape/i);
});

test("ships five fixed 60-day curricula and the reminder pool", async () => {
  const [curriculum, reminders, hosting] = await Promise.all([
    readFile(new URL("../lib/curriculum.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/reminders.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(curriculum, /Array\.from\(\{ length: 60 \}/);
  assert.match(curriculum, /结构化分析与验证/);
  assert.match(curriculum, /毕业项目 · 20例测试/);
  assert.match(curriculum, /export const ENGLISH_LESSONS/);
  assert.match(curriculum, /export const BUSINESS_LESSONS/);
  assert.match(curriculum, /export const FOUNDER_NOTE_LESSONS/);
  assert.match(curriculum, /export const QUIZ_LESSONS/);
  assert.match(curriculum, /\.\.\.ENGLISH_LESSONS/);
  assert.match(curriculum, /\.\.\.BUSINESS_LESSONS/);
  assert.match(reminders, /recentTemplateIds\.slice\(0, 5\)/);
  assert.match(reminders, /今天的知识不会自己长进脑子/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});
