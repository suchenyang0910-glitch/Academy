import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPPORTED_LOCALES = new Set(["vi", "km", "th"]);
const VALID_ACTION = "import_localization_draft";
const VALID_STATUSES = new Set(["draft", "pending_review"]);

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCriteriaJson(value, label, errors) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      errors.push(`${label}.criteriaJson must be valid JSON`);
      return null;
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  errors.push(`${label}.criteriaJson must be an object or JSON string`);
  return null;
}

function validateAssessment(lesson, criteria, errors) {
  const label = `lesson:${lesson.lessonId || "missing"}`;
  const assessment = criteria?.assessment;
  if (!assessment || assessment.type !== "multiple_choice") {
    errors.push(`${label}.criteriaJson.assessment.type must be multiple_choice`);
    return;
  }
  const questions = Array.isArray(assessment.questions) ? assessment.questions : [];
  if (questions.length < 3 || questions.length > 5) {
    errors.push(`${label}.assessment.questions must contain 3-5 questions`);
  }
  questions.forEach((question, questionIndex) => {
    const questionLabel = `${label}.assessment.questions[${questionIndex}]`;
    if (!text(question.question)) {
      errors.push(`${questionLabel}.question is required`);
    }
    const options = Array.isArray(question.options) ? question.options : [];
    if (options.length < 2) {
      errors.push(`${questionLabel}.options must contain at least 2 options`);
    }
    const optionIds = new Set();
    options.forEach((option, optionIndex) => {
      const optionLabel = `${questionLabel}.options[${optionIndex}]`;
      if (!text(option?.id)) {
        errors.push(`${optionLabel}.id is required`);
      } else {
        optionIds.add(String(option.id));
      }
      if (!text(option?.label)) {
        errors.push(`${optionLabel}.label is required`);
      }
    });
    if (!text(question.correctOptionId)) {
      errors.push(`${questionLabel}.correctOptionId is required`);
    } else if (!optionIds.has(String(question.correctOptionId))) {
      errors.push(`${questionLabel}.correctOptionId must match one option id`);
    }
    if (!text(question.explanation)) {
      errors.push(`${questionLabel}.explanation is required`);
    }
  });
}

function validateDraft(draft, options = {}) {
  const errors = [];
  const warnings = [];
  const allowEmptyTemplate = options.allowEmptyTemplate === true;

  if (draft?.action !== VALID_ACTION) {
    errors.push(`action must be ${VALID_ACTION}`);
  }
  if (!SUPPORTED_LOCALES.has(draft?.locale)) {
    errors.push("locale must be one of vi, km, th");
  }
  if (!VALID_STATUSES.has(draft?.status)) {
    errors.push("status must be draft or pending_review");
  }
  if (draft?.allowOverwriteApproved !== false) {
    errors.push("allowOverwriteApproved must be false for pre-review imports");
  }

  const courses = Array.isArray(draft?.courses) ? draft.courses : [];
  if (courses.length === 0) {
    errors.push("courses must contain at least one course translation");
  }
  courses.forEach((course, index) => {
    const label = `courses[${index}]`;
    const requiredKeys = allowEmptyTemplate
      ? ["courseId"]
      : ["courseId", "title", "subtitle", "summary"];
    for (const key of requiredKeys) {
      if (!text(course?.[key])) errors.push(`${label}.${key} is required`);
    }
    if (allowEmptyTemplate && !text(course?.title)) {
      warnings.push(`${label}.title is empty; template still needs translation`);
    }
  });

  const lessons = Array.isArray(draft?.lessons) ? draft.lessons : [];
  if (lessons.length === 0) {
    errors.push("lessons must contain at least one lesson translation");
  }
  lessons.forEach((lesson, index) => {
    const label = `lessons[${index}]`;
    const requiredKeys = allowEmptyTemplate
      ? ["lessonId"]
      : ["lessonId", "title", "objective", "content", "practicePrompt"];
    for (const key of requiredKeys) {
      if (!text(lesson?.[key])) errors.push(`${label}.${key} is required`);
    }
    if (!Number.isInteger(Number(lesson?.day)) || Number(lesson.day) < 1) {
      errors.push(`${label}.day must be a positive integer`);
    }
    const criteria = parseCriteriaJson(lesson?.criteriaJson, label, errors);
    if (criteria) {
      if (!Array.isArray(criteria.criteria) || criteria.criteria.length === 0) {
        errors.push(`${label}.criteriaJson.criteria must contain at least one item`);
      } else if (criteria.criteria.some((item) => !text(item))) {
        errors.push(`${label}.criteriaJson.criteria cannot contain empty items`);
      }
      validateAssessment(lesson, criteria, errors);
    }
    if (allowEmptyTemplate && !text(lesson?.title)) {
      warnings.push(`${label}.title is empty; template still needs translation`);
    }
    if (!allowEmptyTemplate && text(lesson?.content).length < 250) {
      warnings.push(`${label}.content is short; confirm it teaches before checking`);
    }
  });

  return { errors, warnings, courseCount: courses.length, lessonCount: lessons.length };
}

const inputPath = argValue("file") ?? process.argv[2];
const allowEmptyTemplate = process.argv.includes("--allow-empty-template");
if (!inputPath) {
  console.error("Usage: npm run content:i18n:validate -- --file ../../content/localization/example.draft.json");
  process.exit(2);
}

const resolvedPath = resolve(inputPath);
let draft;
try {
  draft = JSON.parse(readFileSync(resolvedPath, "utf8"));
} catch (error) {
  console.error(`Invalid localization draft JSON: ${resolvedPath}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const result = validateDraft(draft, { allowEmptyTemplate });
for (const warning of result.warnings) {
  console.warn(`WARN ${warning}`);
}
if (result.errors.length > 0) {
  for (const error of result.errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log(
  `OK localization ${allowEmptyTemplate ? "template" : "draft"} ${resolvedPath} locale=${draft.locale} courses=${result.courseCount} lessons=${result.lessonCount}`,
);
