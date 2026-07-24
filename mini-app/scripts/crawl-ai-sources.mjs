import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(scriptDirectory, "..");
const sourceFile = path.join(appDirectory, "content", "ai-source-seeds.json");
const outputDirectory = path.resolve(
  appDirectory,
  process.env.ACADEMY_AI_SOURCE_DIR || "content/ai-course-sources",
);
const allowedHosts = new Set([
  "api-docs.deepseek.com",
  "ai.google.dev",
  "developers.openai.com",
]);
const requestDelayMs = Number(process.env.ACADEMY_AI_CRAWLER_DELAY_MS || 1200);
const excerptLimit = 12_000;

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizedText(html) {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function pageTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizedText(match[1]).slice(0, 240) : null;
}

function validateSource(source) {
  if (!source?.id || !source?.url || !source?.topic) {
    throw new Error("每个来源必须包含 id、topic 和 url。");
  }
  const parsed = new URL(source.url);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname)) {
    throw new Error(`未获批准的来源域名：${parsed.hostname}`);
  }
  return parsed;
}

async function fetchSource(source) {
  const url = validateSource(source);
  const response = await fetch(url, {
    headers: {
      "user-agent": "AcademyContentResearch/1.0 (+https://academy.linkx.club)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error(`不支持的内容类型：${contentType || "未知"}`);
  }

  const html = await response.text();
  const text = normalizedText(html);
  if (text.length < 200) {
    throw new Error("正文过短，未保存为课程素材。");
  }

  return {
    id: source.id,
    courseLevel: source.courseLevel ?? null,
    topic: source.topic,
    sourceUrl: response.url,
    retrievedAt: new Date().toISOString(),
    title: pageTitle(html),
    excerpt: text.slice(0, excerptLimit),
    truncated: text.length > excerptLimit,
    reviewStatus: "pending_human_review",
    usage: "仅作课程研究素材；不得自动发布为正式课程。",
  };
}

async function delay(milliseconds) {
  if (milliseconds > 0) {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}

const seeds = JSON.parse(await readFile(sourceFile, "utf8"));
if (!Array.isArray(seeds) || seeds.length === 0) {
  throw new Error("AI 课程来源列表为空。");
}

await mkdir(outputDirectory, { recursive: true });
let succeeded = 0;

for (const [index, source] of seeds.entries()) {
  try {
    const material = await fetchSource(source);
    const outputPath = path.join(outputDirectory, `${material.id}.json`);
    await writeFile(outputPath, `${JSON.stringify(material, null, 2)}\n`, "utf8");
    succeeded += 1;
    console.log(`已保存待审核素材：${material.id}`);
  } catch (error) {
    console.error(`跳过 ${source?.id || "unknown"}：${error instanceof Error ? error.message : String(error)}`);
  }

  if (index < seeds.length - 1) {
    await delay(requestDelayMs);
  }
}

if (succeeded === 0) {
  process.exitCode = 1;
  console.error("没有成功抓取任何来源；请检查网络、来源可访问性或审批列表。");
} else {
  console.log(`完成：${succeeded}/${seeds.length} 份素材已进入待审核库。`);
}
