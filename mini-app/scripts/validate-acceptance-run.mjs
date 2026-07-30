import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = {
    file: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--file") {
      args.file = String(argv[i + 1] ?? "");
      i += 1;
    }
  }

  return args;
}

function fail(message) {
  console.error(`acceptance_result=fail`);
  console.error(`reason=${message}`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!args.file) {
  fail("missing --file <docs/acceptance-runs/...md>");
}

const filePath = resolve(args.file);

if (!existsSync(filePath)) {
  fail(`file not found: ${filePath}`);
}

const content = readFileSync(filePath, "utf8");
const uncheckedItems = content.match(/^- \[ \] /gm) ?? [];
const checkedItems = content.match(/^- \[[xX]\] /gm) ?? [];
const resultMatch = content.match(/^acceptance_result:\s*(\S+)/m);
const result = resultMatch?.[1]?.trim().toLowerCase() ?? "";

if (!resultMatch) {
  fail("missing machine-readable line: acceptance_result: pass");
}

if (result !== "pass") {
  fail(`acceptance_result must be pass, got ${result || "empty"}`);
}

if (uncheckedItems.length > 0) {
  fail(`unchecked P0 items remain: ${uncheckedItems.length}`);
}

if (checkedItems.length === 0) {
  fail("no checked items found; this does not look like a completed acceptance run");
}

console.log("acceptance_result=pass");
console.log(`checked_items=${checkedItems.length}`);
console.log("manual_required=no");
