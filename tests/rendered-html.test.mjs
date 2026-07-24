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

test("records Telegram profile fields and tracks qualified referrals", async () => {
  const [page, store, schema, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/academy-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0002_neat_doctor_octopus.sql", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(page, /function ProfileView/);
  assert.match(page, /有效邀请 = Telegram 认证/);
  assert.match(store, /start_param/);
  assert.match(store, /startapp=ref_/);
  assert.match(store, /status = 'qualified'/);
  assert.match(store, /date\(s\.completed_on\) <= date\(\?, '\+7 day'\)/);
  assert.match(schema, /export const invitations/);
  assert.match(migration, /CREATE TABLE `invitations`/);
  assert.match(migration, /ADD `telegram_username`/);
});

test("enforces trial access and grants referral subscription rewards", async () => {
  const [page, store, schema, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/academy-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0003_ordinary_captain_flint.sql", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(page, /21 天免费试用/);
  assert.match(page, /\$19\.9/);
  assert.match(page, /\$199/);
  assert.match(store, /export async function assertLearningAccess/);
  assert.match(store, /referral_30d/);
  assert.match(store, /21 天试用已结束/);
  assert.match(schema, /export const subscriptions/);
  assert.match(migration, /CREATE TABLE `subscriptions`/);
});
