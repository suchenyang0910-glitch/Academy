import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const store = readFileSync(resolve("lib", "academy-store.ts"), "utf8");

function functionBody(name) {
  const start = store.indexOf(`export async function ${name}`);
  assert(start >= 0, `Missing exported function: ${name}`);
  const nextExport = store.indexOf("\nexport async function ", start + 1);
  return store.slice(start, nextExport === -1 ? store.length : nextExport);
}

const protectedLearningWrites = [
  "updateEnrollments",
  "submitLesson",
  "saveNote",
  "submitAbilityAssessment",
  "resolveReviewQueueEntry",
  "saveUploadedArtifact",
  "submitProjectMilestone",
  "saveAgentLabProject",
  "recordAgentRuntimeCheck",
];

for (const name of protectedLearningWrites) {
  const body = functionBody(name);
  assert(
    body.includes("await assertLearningAccess(identity)"),
    `${name} must call await assertLearningAccess(identity) before writing learning state`,
  );
}

const allowedUserWriteExceptions = [
  "updateUserLocale",
  "updateUserPreferences",
  "markReminderOpened",
  "deliverTestReminder",
  "recordConversionEvent",
  "createCompetencyProofShare",
];

for (const name of allowedUserWriteExceptions) {
  assert(store.includes(`function ${name}`), `${name} missing`);
}

console.log("OK learning access gates");
console.log(`protected_learning_writes=${protectedLearningWrites.length}`);
console.log("access_policy=server_side_learning_writes_only");
