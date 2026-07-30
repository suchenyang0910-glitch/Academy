import {
  getSeedValidationMetrics,
  verifyCronSecret,
} from "../../../../../../lib/academy-store";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function progressBar(value: number, target = 100) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const status = clamped >= target ? "is-good" : clamped >= Math.max(40, target * 0.6) ? "is-watch" : "is-risk";
  return `<div class="bar ${status}" aria-label="${clamped}%"><span style="width:${clamped}%"></span></div>`;
}

function metricCard(label: string, value: string | number, hint: string, rate?: number, target?: number) {
  return `<article class="metric-card">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(hint)}</small>
    ${typeof rate === "number" ? progressBar(rate, target) : ""}
  </article>`;
}

function retentionRow(label: string, value: { numerator: number; denominator: number; rate: number }) {
  return `<tr>
    <th>${escapeHtml(label)}</th>
    <td>${value.numerator}/${value.denominator}</td>
    <td>${value.rate}%</td>
    <td>${progressBar(value.rate, 30)}</td>
  </tr>`;
}

function funnelRow(label: string, users: number, denominator: number) {
  const rate = denominator > 0 ? Math.round((users / denominator) * 100) : 0;
  return `<tr>
    <th>${escapeHtml(label)}</th>
    <td>${users}</td>
    <td>${rate}%</td>
    <td>${progressBar(rate, 30)}</td>
  </tr>`;
}

function quizReviewRows(items: Awaited<ReturnType<typeof getSeedValidationMetrics>>["quizNeedsReview"]) {
  if (!items.length) {
    return `<tr><td colspan="7" class="empty">当前没有达到“首交 3 人以上且通过率低于 60%”的重讲项。</td></tr>`;
  }
  return items
    .map(
      (item) => `<tr>
        <td><span class="severity is-${escapeHtml(item.severity)}">${escapeHtml(item.severity)}</span></td>
        <td>${escapeHtml(item.courseTitle)}</td>
        <td>Day ${escapeHtml(item.day)}</td>
        <td>${escapeHtml(item.title)}</td>
        <td>${item.firstPassRate}%</td>
        <td>${item.revisionPassAfterFailRate}%</td>
        <td>${item.attemptCount}</td>
      </tr>`,
    )
    .join("");
}

function reminderConversionRows(
  items: Awaited<ReturnType<typeof getSeedValidationMetrics>>["reminderConversion"],
) {
  return items
    .map(
      (item) => `<tr>
        <th>L${item.level}</th>
        <td>${item.sent}</td>
        <td>${item.deliveryRate}%</td>
        <td>${item.clickRate}%</td>
        <td>${item.completionRate}%</td>
        <td>${item.averageCompletionMinutes ?? "—"}</td>
      </tr>`,
    )
    .join("");
}

function pendingProjectReviewRows(
  items: Awaited<ReturnType<typeof getSeedValidationMetrics>>["pendingProjectReviews"],
) {
  if (!items.length) {
    return `<tr><td colspan="7" class="empty">当前没有待人工审核的项目里程碑。</td></tr>`;
  }
  return items
    .map(
      (item) => `<tr>
        <td>#${item.id}</td>
        <td>${escapeHtml(item.displayName)}</td>
        <td>Day ${escapeHtml(item.checkpointDay)}</td>
        <td>${escapeHtml(item.score)}</td>
        <td>${item.artifactUrl ? `<a href="${escapeHtml(item.artifactUrl)}" target="_blank" rel="noreferrer">Open</a>` : "—"}</td>
        <td>${escapeHtml(item.notes)}</td>
        <td>${escapeHtml(item.submittedAt)}</td>
      </tr>`,
    )
    .join("");
}

function runtimeAuditRows(
  items: Awaited<ReturnType<typeof getSeedValidationMetrics>>["runtimeAuditItems"],
) {
  if (!items.length) {
    return `<tr><td colspan="10" class="empty">No structured runtime audit yet.</td></tr>`;
  }
  return items
    .map(
      (item) => `<tr>
        <td>#${item.id}</td>
        <td>${escapeHtml(item.displayName)}</td>
        <td><span class="severity is-${item.status === "passed" ? "watch" : "high"}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(item.score)}</td>
        <td>${escapeHtml(item.validCaseCount)}</td>
        <td>${escapeHtml(item.citationCaseCount)}</td>
        <td>${item.workflowExportProvided ? "yes" : "no"}</td>
        <td>${item.workflowValid ? "valid" : "invalid"} · ${escapeHtml(item.workflowNodeCount)}/${escapeHtml(item.workflowEdgeCount)}/${escapeHtml(item.workflowUsefulNodeCount)}</td>
        <td>${item.referenceOk ? `ok ${escapeHtml(item.referenceStatus ?? "")}` : "failed"} · ${escapeHtml(item.referenceProbeSignals.join(", ") || "no_probe")}</td>
        <td>${escapeHtml(item.errors.join(", ") || "—")}</td>
      </tr>`,
    )
    .join("");
}

function pendingKnowledgeSourceRows(
  items: Awaited<ReturnType<typeof getSeedValidationMetrics>>["pendingKnowledgeSources"],
) {
  if (!items.length) {
    return `<tr><td colspan="7" class="empty">当前没有待审核素材。GitHub / PDF / Docs 进入这里后，必须人工审核，不能自动变课程。</td></tr>`;
  }
  return items
    .map(
      (item) => `<tr>
        <td>#${item.id}</td>
        <td><span class="severity is-watch">${escapeHtml(item.sourceType)}</span></td>
        <td>${escapeHtml(item.title)}</td>
        <td>${item.sourceUrl ? `<a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Open</a>` : "—"}</td>
        <td>${escapeHtml(item.license ?? "unknown")}</td>
        <td>${escapeHtml(item.relevance)}</td>
        <td>${escapeHtml(item.createdAt)}</td>
      </tr>`,
    )
    .join("");
}

function renderDashboard(validation: Awaited<ReturnType<typeof getSeedValidationMetrics>>) {
  const seedProgress = Math.round(
    (Math.min(validation.participantCount, validation.targets.seedUsers) /
      validation.targets.seedUsers) *
      100,
  );
  const updatedAt = new Date().toISOString();
  return `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Academy Seed Validation Dashboard</title>
  <style>
    :root { color-scheme: light; --ink:#20221d; --muted:#74746a; --paper:#f6f1e7; --card:#fffaf0; --line:#d9d0bd; --accent:#b8664d; --green:#4f7a58; --gold:#a48250; --red:#a14f49; }
    body { margin:0; font-family: ui-serif, Georgia, "Times New Roman", serif; background:var(--paper); color:var(--ink); }
    main { max-width:1120px; margin:0 auto; padding:32px 20px 56px; }
    header { display:flex; justify-content:space-between; gap:20px; align-items:flex-end; border-bottom:1px solid var(--line); padding-bottom:20px; margin-bottom:24px; }
    h1 { margin:0; font-size:clamp(32px,5vw,64px); line-height:.95; letter-spacing:-.05em; }
    h2 { margin:0 0 14px; font-size:22px; }
    p { color:var(--muted); line-height:1.65; }
    .eyebrow, .metric-card span { display:block; color:var(--accent); font:700 12px/1.2 ui-sans-serif, system-ui; letter-spacing:.18em; text-transform:uppercase; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:14px; margin:18px 0 28px; }
    .metric-card, section { background:rgba(255,250,240,.72); border:1px solid var(--line); padding:18px; box-shadow:0 10px 30px rgba(32,34,29,.04); }
    .metric-card strong { display:block; font-size:34px; margin:10px 0 4px; letter-spacing:-.04em; }
    .metric-card small { color:var(--muted); }
    .bar { height:9px; background:#e6dfd1; border:1px solid var(--line); margin-top:14px; overflow:hidden; }
    .bar span { display:block; height:100%; background:var(--accent); }
    .bar.is-good span { background:var(--green); }
    .bar.is-watch span { background:var(--gold); }
    .bar.is-risk span { background:var(--red); }
    .sections { display:grid; grid-template-columns:minmax(0,1fr); gap:18px; }
    table { width:100%; border-collapse:collapse; font:14px/1.45 ui-sans-serif, system-ui; }
    th, td { text-align:left; padding:12px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
    th { color:var(--muted); font-weight:700; }
    .severity { display:inline-block; padding:4px 8px; border:1px solid var(--line); text-transform:uppercase; font-size:11px; letter-spacing:.12em; }
    .severity.is-high { color:var(--red); border-color:var(--red); }
    .severity.is-medium { color:var(--gold); border-color:var(--gold); }
    .severity.is-watch { color:var(--green); border-color:var(--green); }
    .empty { color:var(--muted); text-align:center; padding:28px; }
    code { background:#eee5d6; padding:2px 6px; border-radius:4px; }
    @media (max-width: 760px) { header { display:block; } table { font-size:12px; } th, td { padding:10px 6px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <span class="eyebrow">Academy Validation</span>
        <h1>Seed User<br />Dashboard</h1>
        <p>用于首轮 10 人验证：不是看“上了多少课”，而是看是否留下 Evidence、是否跑出 Day 7 原型、是否完成 Day 21 DoD。</p>
      </div>
      <p>Updated<br /><code>${escapeHtml(updatedAt)}</code></p>
    </header>

    <div class="grid">
      ${metricCard("Seed Users", validation.participantCount, `目标 ${validation.targets.seedUsers} 人`, seedProgress, 100)}
      ${metricCard("FWPR-7", `${validation.fwpr7.rate}%`, `${validation.fwpr7.numerator}/${validation.fwpr7.denominator} 人 Day7 跑通原型`, validation.fwpr7.rate, validation.targets.fwpr7Rate)}
      ${metricCard("Day21 DoD", validation.day21DodCount, `目标 ${validation.targets.day21DodCount} 人完成`, validation.day21DodRate, 30)}
      ${metricCard("Evidence Rate", `${validation.evidenceSubmissionRate}%`, `${validation.day0CompletedCount + validation.day7PrototypeCount + validation.day21DodCount}/${validation.participantCount * 3} 个检查点`, validation.evidenceSubmissionRate, 70)}
      ${metricCard("Evidence Submitters", `${validation.evidenceSubmitterRate}%`, "至少提交过 1 个目标证据的人", validation.evidenceSubmitterRate, 70)}
      ${metricCard("Quiz Needs Review", validation.quizNeedsReview.length, "首交低通过率课程项")}
      ${metricCard("Paid Users", validation.conversionFunnel.paidUsers, "真实完成 Stars 支付的人")}
      ${metricCard("Pending Project Reviews", validation.pendingProjectReviews.length, "等待人工验收的 Day7/Day21 证据")}
      ${metricCard("Runtime Audits", validation.runtimeAuditItems.length, "structured runtime checks")}
      ${metricCard("Knowledge Hub Pending", validation.pendingKnowledgeSources.length, "等待人工审核的 GitHub / PDF / Docs 素材")}
    </div>

    <div class="sections">
      <section>
        <h2>Retention by Evidence</h2>
        <table>
          <thead><tr><th>窗口</th><th>人数</th><th>留存率</th><th>进度</th></tr></thead>
          <tbody>
            ${retentionRow("D1", validation.retention.d1)}
            ${retentionRow("D7", validation.retention.d7)}
            ${retentionRow("D21", validation.retention.d21)}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Quiz Needs Review</h2>
        <table>
          <thead>
            <tr><th>级别</th><th>课程</th><th>Day</th><th>课题</th><th>首交通过</th><th>修正通过</th><th>提交</th></tr>
          </thead>
          <tbody>${quizReviewRows(validation.quizNeedsReview)}</tbody>
        </table>
      </section>

      <section>
        <h2>Payment & Referral Conversion Funnel</h2>
        <table>
          <thead><tr><th>步骤</th><th>用户数</th><th>转化率</th><th>进度</th></tr></thead>
          <tbody>
            ${funnelRow("Trial Expired Exposed", validation.conversionFunnel.trialExpiredExposedUsers, validation.participantCount)}
            ${funnelRow("Plans Opened", validation.conversionFunnel.plansOpenedUsers, validation.conversionFunnel.trialExpiredExposedUsers)}
            ${funnelRow("Price Clicked", validation.conversionFunnel.priceClickedUsers, validation.conversionFunnel.plansOpenedUsers)}
            ${funnelRow("Invoice Created", validation.conversionFunnel.invoiceCreatedUsers, validation.conversionFunnel.priceClickedUsers)}
            ${funnelRow("Paid", validation.conversionFunnel.paidUsers, validation.conversionFunnel.invoiceCreatedUsers)}
            ${funnelRow("Credits Redeemed on Paid Order", validation.conversionFunnel.creditsRedeemedPaidUsers, validation.conversionFunnel.paidUsers)}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Reminder Conversion</h2>
        <table>
          <thead><tr><th>等级</th><th>发送</th><th>送达率</th><th>点击率</th><th>完成率</th><th>平均补课分钟</th></tr></thead>
          <tbody>${reminderConversionRows(validation.reminderConversion)}</tbody>
        </table>
      </section>

      <section>
        <h2>Pending Project Reviews</h2>
        <p>审核通过才会把 Day7 / Day21 原型证据计入 FWPR-7 或 DoD。使用 <code>POST /api/academy/admin/goals/milestones</code> 执行 approve / request_revision。</p>
        <table>
          <thead><tr><th>ID</th><th>用户</th><th>检查点</th><th>规则分</th><th>链接</th><th>备注</th><th>提交时间</th></tr></thead>
          <tbody>${pendingProjectReviewRows(validation.pendingProjectReviews)}</tbody>
        </table>
      </section>

      <section>
        <h2>Structured Runtime Audit</h2>
        <p>Agent Lab runtime check 不再信任自评。它必须留下测试用例、引用线索、可识别的 Flowise workflow export 和可访问 runtime/reference 链接；失败行会说明具体缺口。</p>
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Status</th><th>Score</th><th>Cases</th><th>Citations</th><th>Export</th><th>Flowise</th><th>Reference</th><th>Errors</th></tr></thead>
          <tbody>${runtimeAuditRows(validation.runtimeAuditItems)}</tbody>
        </table>
      </section>

      <section>
        <h2>Knowledge Hub Pending Review</h2>
        <p>素材先进入 <code>knowledge_sources</code>，默认 <code>pending_review</code>。GitHub 项目、PDF、Docs 只作为待审核来源；审核通过前不会自动生成课程或改变学习路径。</p>
        <table>
          <thead><tr><th>ID</th><th>Type</th><th>Title</th><th>Source</th><th>License</th><th>Relevance</th><th>Created</th></tr></thead>
          <tbody>${pendingKnowledgeSourceRows(validation.pendingKnowledgeSources)}</tbody>
        </table>
      </section>
    </div>
  </main>
</body>
</html>`;
}

export async function GET(request: Request) {
  try {
    verifyCronSecret(request);
    const validation = await getSeedValidationMetrics();
    return new Response(renderDashboard(validation), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(escapeHtml(message), { status: 500 });
  }
}
