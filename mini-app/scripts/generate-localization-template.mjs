import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COURSE_CATALOG, FIXED_LESSONS } from "../lib/curriculum.ts";

const SUPPORTED_LOCALES = new Set(["vi", "km", "th"]);

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function parseDayRange(value) {
  const raw = String(value ?? "1-7").trim();
  if (/^\d+$/.test(raw)) {
    const day = Number(raw);
    return { start: day, end: day };
  }
  const [startRaw, endRaw] = raw.split("-");
  const start = Number(startRaw || 1);
  const end = Number(endRaw || start);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
    throw new Error(`Invalid --days value: ${raw}`);
  }
  return { start, end };
}

function safeFilename(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}

const locale = argValue("locale", "vi");
if (!SUPPORTED_LOCALES.has(locale)) {
  throw new Error("--locale must be one of vi, km, th. zh-Hans is the source locale.");
}

const courseId = argValue("course", "ai-command-skills");
const course = COURSE_CATALOG.find((item) => item.id === courseId);
if (!course) throw new Error(`Unknown --course: ${courseId}`);

const { start, end } = parseDayRange(argValue("days", "1-7"));
const sourceVersion = argValue("source-version", "v1");
const reviewStatus = argValue("status", "draft");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..", "..");
const outputPath =
  argValue("out") ??
  resolve(
    repoRoot,
    "content",
    "localization",
    `${safeFilename(courseId)}-${locale}-day${start}-${end}.draft.json`,
  );

const lessons = FIXED_LESSONS.filter(
  (lesson) => lesson.courseId === courseId && lesson.day >= start && lesson.day <= end,
).map((lesson) => ({
  lessonId: lesson.id,
  day: lesson.day,
  sourceTitle: lesson.title,
  title: "",
  objective: "",
  content: "",
  practicePrompt: "",
  criteriaJson: JSON.stringify(
    {
      criteria: lesson.criteria,
      assessment: lesson.assessment,
      translationNotes: [
        "Keep option ids unchanged.",
        "Translate labels/explanations only.",
        "Do not translate code, commands, product names, IDs, JSON keys, or controlled values.",
      ],
    },
    null,
    2,
  ),
}));

const template = {
  action: "import_localization_draft",
  locale,
  sourceVersion,
  status: reviewStatus,
  importedBy: "academy-localization-template",
  allowOverwriteApproved: false,
  importNotes: [
    "POST this JSON to /api/academy/admin/course-review with Authorization: Bearer <ACADEMY_CRON_SECRET>.",
    "Fill translated fields before import.",
    "Import creates draft/pending_review records only; approved translations are skipped by default.",
    "User-facing lessons still require review_lesson_localization -> approved before they appear.",
  ],
  courses: [
    {
      courseId: course.id,
      sourceTitle: course.title,
      title: "",
      subtitle: "",
      summary: "",
    },
  ],
  lessons,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");

console.log(`Localization draft template written: ${outputPath}`);
console.log(`course=${courseId} locale=${locale} lessons=${lessons.length} days=${start}-${end}`);
