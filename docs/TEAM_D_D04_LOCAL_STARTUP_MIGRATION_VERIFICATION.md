# ACAD-D-004：本地启动与迁移验证脚本复核

## 1. 目标

- 本地启动前，能用一条命令完成数据库迁移并做最小自检（表存在、迁移记录存在）。
- 迁移脚本在 Windows 路径环境下可运行（避免 file URL pathname 拼接造成的路径错误）。

## 2. 现有脚本

### 2.1 SQLite（本地默认）

- 迁移：`mini-app/scripts/migrate.mjs`
  - 使用 `DatabaseSync` 执行 `mini-app/drizzle/*.sql`
  - 通过 `__academy_migrations` 记录已应用迁移，实现幂等

### 2.2 Postgres（生产/云端）

- 迁移：`mini-app/scripts/migrate-postgres.mjs`
  - 通过 `__academy_migrations(name, checksum)` 记录已应用迁移
  - checksum 变化会拒绝继续（防止迁移被篡改）

### 2.3 导入（SQLite → Postgres）

- 导入：`mini-app/scripts/import-sqlite-to-postgres.mjs`
  - 仅用于把旧 SQLite 数据批量导入 Postgres（需先完成 Postgres migrations）

## 3. 新增验证脚本（推荐使用）

- `mini-app/scripts/verify-local.mjs`
- npm 脚本：`mini-app/package.json` 中的 `db:verify`

### 3.1 SQLite 模式

```bash
cd mini-app
npm run db:verify -- --mode sqlite --database-path data/academy.sqlite
```

会执行：
- 运行 SQLite migrations（幂等）
- 校验关键表存在（users/enrollments/lessons/submissions/notes/invitations/credits_ledger/campaign_rewards/order_pricing_snapshots）
- 校验 `__academy_migrations` 条目数 ≥ `drizzle/*.sql` 文件数

### 3.2 Postgres 模式

```bash
cd mini-app
set ACADEMY_DATABASE_URL=postgres://...
npm run db:verify -- --mode postgres
```

会执行：
- 运行 Postgres migrations（幂等）
- 校验关键表存在
- 校验 `__academy_migrations` 至少有 1 条记录

## 4. 启动建议顺序（本地）

```bash
cd mini-app
npm run db:verify
npm run dev
```

