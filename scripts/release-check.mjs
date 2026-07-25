import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function resolveCommand(command) {
  if (process.platform === "win32" && (command === "npm" || command === "npx")) {
    return `${command}.cmd`;
  }
  return command;
}

function run(command, args, options = {}) {
  const resolved = resolveCommand(command);
  const invoke =
    process.platform === "win32" && resolved.endsWith(".cmd")
      ? {
          command: "cmd.exe",
          args: [
            "/d",
            "/s",
            "/c",
            [resolved, ...args]
              .map((part) => (/[ \t"]/u.test(part) ? `"${part.replaceAll('"', '\\"')}"` : part))
              .join(" "),
          ],
        }
      : { command: resolved, args };
  const result = spawnSync(invoke.command, invoke.args, {
    stdio: "inherit",
    cwd: options.cwd,
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    const detail = result.error ? ` (${result.error.message})` : "";
    throw new Error(`Failed: ${command} ${args.join(" ")}${detail}`);
  }
}

function parseArgs(argv) {
  const flags = new Set(argv);
  return {
    skipPython: flags.has("--skip-python"),
    skipMiniApp: flags.has("--skip-mini-app"),
    skipDbVerify: flags.has("--skip-db-verify"),
  };
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(".");
const miniApp = resolve("mini-app");

try {
  if (!args.skipPython) {
    run("python", ["-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py"], {
      cwd: root,
    });
  }

  if (!args.skipMiniApp) {
    if (!args.skipDbVerify) {
      run("npm", ["run", "db:verify"], { cwd: miniApp });
    }
    run("npm", ["test"], { cwd: miniApp });
  }

  process.stdout.write("OK release-check\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "Unexpected error"}\n`);
  process.exitCode = 1;
}
