import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadCurriculumModule() {
  const sourcePath = resolve("lib", "curriculum.ts");
  const source = readFileSync(sourcePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require(name) {
      throw new Error(`Unexpected import while checking curriculum quality: ${name}`);
    },
  };

  vm.runInNewContext(outputText, sandbox, { filename: sourcePath });
  return module.exports;
}

function validateMultipleChoice(lesson) {
  assert(lesson.assessment?.type === "multiple_choice", `${lesson.id}: missing multiple-choice assessment`);
  const questions = lesson.assessment.questions ?? [];
  assert(
    questions.length >= 3 && questions.length <= 5,
    `${lesson.id}: expected 3-5 questions, got ${questions.length}`,
  );

  for (const [index, question] of questions.entries()) {
    assert(question.question, `${lesson.id}: question ${index + 1} missing text`);
    assert(
      Array.isArray(question.options) && question.options.length >= 3,
      `${lesson.id}: question ${index + 1} needs at least 3 options`,
    );
    assert(
      question.options.some((option) => option.id === question.correctOptionId),
      `${lesson.id}: question ${index + 1} correct option does not exist`,
    );
    assert(question.explanation, `${lesson.id}: question ${index + 1} missing explanation`);
  }
}

function validateAiTeachingBeforeAssessment(lesson) {
  const content = String(lesson.content ?? "");
  const practicePrompt = String(lesson.practicePrompt ?? "");
  const lessonText = `${content}\n${practicePrompt}`;
  const checkIndex = content.indexOf("课后检查：");

  assert(content.includes("先学知识，再做检查。"), `${lesson.id}: missing teaching-first guard`);
  assert(content.includes("今天你会学到："), `${lesson.id}: missing learning preview`);
  assert(content.includes("核心原则："), `${lesson.id}: missing explicit core principle`);
  assert(content.includes("能力目标："), `${lesson.id}: missing explicit capability objective`);
  assert(checkIndex > content.indexOf("今天你会学到："), `${lesson.id}: assessment appears before teaching`);
  assert(content.slice(0, checkIndex).length >= 220, `${lesson.id}: teaching block is too thin before assessment`);
  assert(practicePrompt.includes("课后动作："), `${lesson.id}: missing practice action before check`);
  assert(practicePrompt.includes("课后检查："), `${lesson.id}: missing practice check instructions`);

  for (const criterion of lesson.criteria ?? []) {
    assert(
      lessonText.includes(criterion),
      `${lesson.id}: criterion is not visible before/around assessment: ${criterion}`,
    );
  }
}

function validateGeneratedAiQuestionCoverage(lesson) {
  const teachingBeforeCheck = String(lesson.content ?? "").split("课后检查：")[0] ?? "";

  for (const question of lesson.assessment.questions ?? []) {
    const correctLabel = question.options.find((option) => option.id === question.correctOptionId)?.label;
    if (!correctLabel) continue;

    if (
      question.question.includes("核心原则") ||
      question.question.includes("完成本课后")
    ) {
      assert(
        teachingBeforeCheck.includes(correctLabel),
        `${lesson.id}: generated answer is tested but not explicitly taught: ${correctLabel}`,
      );
    }
  }
}

const { AI_LESSONS } = loadCurriculumModule();

assert(Array.isArray(AI_LESSONS), "AI_LESSONS export missing");

for (const lesson of AI_LESSONS.slice(0, 14)) {
  validateMultipleChoice(lesson);
  validateAiTeachingBeforeAssessment(lesson);
  validateGeneratedAiQuestionCoverage(lesson);
}

const beginnerRequiredTokens = [
  ["知识讲解", "示例", "AI 可以协助", "不能替你负责"],
  ["模型", "应用", "上下文", "输出"],
  ["上下文", "目标", "限制", "成功标准"],
  ["幻觉", "事实", "高风险", "验证"],
  ["Prompt", "目标", "材料", "格式", "限制"],
  ["示例", "角色", "拆步骤", "单变量"],
  ["Workflow", "输入", "处理", "检查", "输出"],
];

for (const [index, tokens] of beginnerRequiredTokens.entries()) {
  const lesson = AI_LESSONS[index];
  const lessonText = `${lesson.title}\n${lesson.content}\n${lesson.practicePrompt}`;
  for (const token of tokens) {
    assert(
      lessonText.includes(token),
      `${lesson.id}: beginner AI Day ${index + 1} missing token: ${token}`,
    );
  }
}

for (const lesson of AI_LESSONS.slice(7, 14)) {
  const content = String(lesson.content ?? "");
  for (const token of ["知识：", "例子：", "检查：", "最小实操："]) {
    assert(content.includes(token), `${lesson.id}: Day 8-14 must include ${token}`);
  }
}

console.log("OK curriculum quality gate");
console.log("ai_days_checked=14");
console.log("ai_days_8_14_structure=yes");
