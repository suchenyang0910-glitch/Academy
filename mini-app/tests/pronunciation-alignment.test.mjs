import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule } from "node:vm";
import ts from "typescript";
import test from "node:test";

async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const vmModule = new SourceTextModule(
    ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText,
  );
  await vmModule.link(() => { throw new Error("Unexpected dependency"); });
  await vmModule.evaluate();
  return vmModule.namespace;
}

test("pronunciation helper measures transcript coverage without claiming an acoustic score", async () => {
  const { alignTranscriptToPhrase } = await load("../lib/pronunciation-alignment.ts");
  const result = alignTranscriptToPhrase("Could you say that again, please?", "Could you say that please");
  assert.equal(result.coveragePercent, 83);
  assert.deepEqual(result.missingWords, ["again"]);
  assert.deepEqual(result.matchedWords, ["could", "you", "say", "that", "please"]);
});

test("alignment normalizes punctuation and keeps repeated words accountable", async () => {
  const { alignTranscriptToPhrase } = await load("../lib/pronunciation-alignment.ts");
  const result = alignTranscriptToPhrase("I would like a coffee, please.", "I would like coffee please");
  assert.deepEqual(result.missingWords, ["a"]);
  assert.equal(result.coveragePercent, 83);
});
