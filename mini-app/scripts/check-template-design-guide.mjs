import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(resolve("..", path), "utf8");
}

const guidePath = resolve("..", "TEMPLATE_DESIGN_GUIDE.md");
assert(existsSync(guidePath), "Missing TEMPLATE_DESIGN_GUIDE.md");

const guide = read("TEMPLATE_DESIGN_GUIDE.md");
const requirements = read("REQUIREMENTS.md");
const store = read("mini-app/lib/academy-store.ts");

for (const token of [
  "Nothing counts unless it is evidenced",
  "Template Card",
  "Definition of Done",
  "Evidence Model",
  "Progress Mapping",
  "Recovery Loop",
  "personal-knowledge-assistant-21d",
  "拒绝清单",
]) {
  assert(guide.includes(token), `Template guide missing required section: ${token}`);
}

assert(
  requirements.includes("[目标模板设计规范](TEMPLATE_DESIGN_GUIDE.md)"),
  "REQUIREMENTS.md must link to TEMPLATE_DESIGN_GUIDE.md",
);

for (const token of [
  "const PRIMARY_GOAL_TEMPLATE_ID = \"personal-knowledge-assistant-21d\"",
  "definitionOfDone",
  "checkpoints",
  "evidence",
  "GOAL_PROGRESS_MAPPINGS",
  "COURSE_COMPETENCY_MAPPINGS",
]) {
  assert(store.includes(token), `Primary goal template implementation missing: ${token}`);
}

console.log("OK template design guide");
console.log("template_policy=adapter_safe_evidence_first");
console.log("allowed_template=personal-knowledge-assistant-21d");
