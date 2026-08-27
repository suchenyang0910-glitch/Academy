import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const DEFAULT_VAULT_PATH = "E:\\Obsidian\\Codex-Memory";
const IGNORED_DIRS = new Set([".git", ".obsidian", ".trash", "node_modules"]);

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [name, ...rest] = line.split("=");
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (name.trim()) process.env[name.trim()] ??= value;
  }
}

function parseArgs(argv) {
  const args = {
    vault: process.env.ACADEMY_OBSIDIAN_VAULT_PATH ?? DEFAULT_VAULT_PATH,
    databasePath: process.env.ACADEMY_DATABASE_PATH ?? "data/academy.sqlite",
    dryRun: false,
    limit: 0,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--vault") args.vault = String(argv[index + 1] ?? "");
    if (token === "--database-path") args.databasePath = String(argv[index + 1] ?? "");
    if (token === "--dry-run") args.dryRun = true;
    if (token === "--limit") args.limit = Math.max(0, Number(argv[index + 1] ?? 0));
  }
  return args;
}

function walkMarkdownFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) visit(resolve(directory, entry.name));
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        files.push(resolve(directory, entry.name));
      }
    }
  }
  visit(root);
  return files.sort((left, right) => left.localeCompare(right));
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith("---")) return { body: markdown, frontmatter: "" };
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return { body: markdown, frontmatter: "" };
  return {
    frontmatter: markdown.slice(3, end).trim(),
    body: markdown.slice(end + 4).trimStart(),
  };
}

function titleFrom(markdown, filePath) {
  const { body, frontmatter } = stripFrontmatter(markdown);
  const titleLine = frontmatter
    .split(/\r?\n/)
    .find((line) => /^title\s*:/i.test(line));
  const frontmatterTitle = titleLine
    ?.replace(/^title\s*:/i, "")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (frontmatterTitle) return frontmatterTitle.slice(0, 240);
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading.slice(0, 240);
  return filePath
    .split(/[\\/]/)
    .pop()
    ?.replace(/\.md$/i, "")
    .slice(0, 240) ?? "Untitled Obsidian note";
}

function tagsFrom(markdown) {
  const inlineTags = Array.from(markdown.matchAll(/(^|\s)#([\p{L}\p{N}_/-]+)/gu)).map(
    (match) => match[2],
  );
  const frontmatter = stripFrontmatter(markdown).frontmatter;
  const frontmatterTags = [];
  const tagsLine = frontmatter
    .split(/\r?\n/)
    .find((line) => /^tags\s*:/i.test(line));
  if (tagsLine) {
    const raw = tagsLine.replace(/^tags\s*:/i, "").trim();
    for (const item of raw.replace(/^\[|\]$/g, "").split(",")) {
      const tag = item.trim().replace(/^["']|["']$/g, "");
      if (tag) frontmatterTags.push(tag);
    }
  }
  return [...new Set([...frontmatterTags, ...inlineTags])].slice(0, 24);
}

function summaryFrom(markdown) {
  const body = stripFrontmatter(markdown).body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, (match) => match.replace(/^\[|\]\([^)]+\)$/g, ""))
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return body.slice(0, 900);
}

function headingsFrom(markdown) {
  return Array.from(stripFrontmatter(markdown).body.matchAll(/^(#{1,4})\s+(.+)$/gm))
    .map((match) => ({
      depth: match[1].length,
      title: match[2].trim().slice(0, 160),
    }))
    .slice(0, 32);
}

function buildSource(root, filePath) {
  const markdown = readFileSync(filePath, "utf8");
  const stats = statSync(filePath);
  const relativePath = relative(root, filePath).split(sep).join("/");
  const checksum = createHash("sha256").update(markdown).digest("hex");
  return {
    sourceType: "obsidian",
    title: titleFrom(markdown, filePath),
    sourceUrl: pathToFileURL(filePath).href,
    canonicalRef: `obsidian:${root.toLowerCase()}:${relativePath.toLowerCase()}`,
    license: "private-notes",
    relevance: "personal_learning_memory",
    status: "pending_review",
    metadataJson: JSON.stringify({
      vaultPath: root,
      relativePath,
      checksum,
      byteLength: Buffer.byteLength(markdown, "utf8"),
      modifiedAt: stats.mtime.toISOString(),
      tags: tagsFrom(markdown),
      headings: headingsFrom(markdown),
      summary: summaryFrom(markdown),
      sourcePolicy: "private_obsidian_note_pending_review",
      courseGeneration: "disabled_until_human_review",
    }),
    createdBy: "obsidian-sync",
  };
}

function upsertSqlite(databasePath, sources) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath, { enableForeignKeyConstraints: true });
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  const statement = db.prepare(`
    INSERT INTO knowledge_sources
      (source_type, title, source_url, canonical_ref, license, relevance, status, metadata_json, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
    ON CONFLICT(canonical_ref) DO UPDATE SET
      title = excluded.title,
      source_url = excluded.source_url,
      license = excluded.license,
      relevance = excluded.relevance,
      metadata_json = excluded.metadata_json,
      updated_at = CURRENT_TIMESTAMP
  `);
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const source of sources) {
      statement.run(
        source.sourceType,
        source.title,
        source.sourceUrl,
        source.canonicalRef,
        source.license,
        source.relevance,
        source.metadataJson,
        source.createdBy,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

async function upsertPostgres(databaseUrl, sources) {
  const { Client } = pg;
  const client = new Client({ connectionString: databaseUrl, application_name: "academy-obsidian-sync" });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const source of sources) {
      await client.query(
        `INSERT INTO knowledge_sources
           (source_type, title, source_url, canonical_ref, license, relevance, status, metadata_json, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending_review', $7, $8)
         ON CONFLICT(canonical_ref) DO UPDATE SET
           title = excluded.title,
           source_url = excluded.source_url,
           license = excluded.license,
           relevance = excluded.relevance,
           metadata_json = excluded.metadata_json,
           updated_at = CURRENT_TIMESTAMP::text`,
        [
          source.sourceType,
          source.title,
          source.sourceUrl,
          source.canonicalRef,
          source.license,
          source.relevance,
          source.metadataJson,
          source.createdBy,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

loadEnvFile(resolve(".env"));
const args = parseArgs(process.argv.slice(2));
const vaultPath = resolve(args.vault);

if (!existsSync(vaultPath)) {
  throw new Error(`Obsidian vault path does not exist: ${vaultPath}`);
}

const files = walkMarkdownFiles(vaultPath);
const selectedFiles = args.limit > 0 ? files.slice(0, args.limit) : files;
const sources = selectedFiles.map((filePath) => buildSource(vaultPath, filePath));

if (args.dryRun) {
  console.log(`DRY RUN obsidian vault=${vaultPath} markdown=${files.length} selected=${sources.length}`);
  for (const source of sources.slice(0, 10)) {
    console.log(`${source.title} | ${source.canonicalRef}`);
  }
  process.exit(0);
}

if (sources.length > 0) {
  if (process.env.ACADEMY_DATABASE_URL) {
    await upsertPostgres(process.env.ACADEMY_DATABASE_URL, sources);
  } else {
    upsertSqlite(resolve(args.databasePath), sources);
  }
}

console.log(`OK obsidian sync vault=${vaultPath} markdown=${files.length} imported=${sources.length}`);
