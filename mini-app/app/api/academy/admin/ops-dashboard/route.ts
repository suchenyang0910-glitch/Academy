import {
  createSeedUserNote,
  getAdminOpsDashboardData,
  verifyCronSecret,
} from "../../../../../lib/academy-store";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function metricCard(label: string, value: string | number, hint: string) {
  return `<article class="metric-card">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(hint)}</small>
  </article>`;
}

function learnerRows(items: Awaited<ReturnType<typeof getAdminOpsDashboardData>>["learners"]) {
  if (!items.length) return `<tr><td colspan="7" class="empty">No learners yet.</td></tr>`;
  return items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.displayName)}</td>
        <td>${escapeHtml(item.telegramId ?? "—")}</td>
        <td>${escapeHtml(item.activeCourses)}</td>
        <td>Day ${escapeHtml(item.maxCurrentDay)}</td>
        <td>${escapeHtml(item.acceptedEvidence)}</td>
        <td>${escapeHtml(item.lastEvidenceOn ?? "—")}</td>
        <td>${item.reminderEnabled ? "on" : "off"}</td>
      </tr>`,
    )
    .join("");
}

function paymentRows(items: Awaited<ReturnType<typeof getAdminOpsDashboardData>>["payments"]) {
  if (!items.length) return `<tr><td colspan="8" class="empty">No payment orders yet.</td></tr>`;
  return items
    .map(
      (item) => `<tr>
        <td>#${escapeHtml(item.orderId)}</td>
        <td>${escapeHtml(item.displayName ?? item.userId)}</td>
        <td>${escapeHtml(item.planKey)}</td>
        <td>${escapeHtml(item.amountStars)} Stars</td>
        <td>${escapeHtml(item.orderStatus)}</td>
        <td>${escapeHtml(item.transactionStatus ?? "—")}</td>
        <td>${escapeHtml(item.telegramPaymentChargeId ?? "—")}</td>
        <td>${item.refundedAt ? `refunded ${escapeHtml(item.refundedAt)}` : escapeHtml(item.paidAt ?? item.orderCreatedAt)}</td>
      </tr>`,
    )
    .join("");
}

function invitationRows(
  items: Awaited<ReturnType<typeof getAdminOpsDashboardData>>["riskyInvitations"],
) {
  if (!items.length) return `<tr><td colspan="8" class="empty">No risky invitations.</td></tr>`;
  return items
    .map(
      (item) => `<tr>
        <td>#${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.inviterName ?? item.inviterUserId)}</td>
        <td>${escapeHtml(item.invitedName ?? item.invitedUserId)}</td>
        <td><span class="pill is-${escapeHtml(item.riskLevel)}">${escapeHtml(item.riskLevel)}</span></td>
        <td>${escapeHtml(item.status)}</td>
        <td>${escapeHtml(item.statusReason ?? "—")}</td>
        <td>${escapeHtml(item.rewardGrantedAt ?? "—")}</td>
        <td>${escapeHtml(item.createdAt)}</td>
      </tr>`,
    )
    .join("");
}

function reviewRows(items: Awaited<ReturnType<typeof getAdminOpsDashboardData>>["openReviews"]) {
  if (!items.length) return `<tr><td colspan="7" class="empty">No open review queue items.</td></tr>`;
  return items
    .map(
      (item) => `<tr>
        <td>#${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.displayName ?? item.userId)}</td>
        <td>${escapeHtml(item.sourceType)}#${escapeHtml(item.sourceRef)}</td>
        <td>${escapeHtml(item.reason)}</td>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.dueOn)}</td>
        <td>${escapeHtml(item.createdAt)}</td>
      </tr>`,
    )
    .join("");
}

function feedbackRows(items: Awaited<ReturnType<typeof getAdminOpsDashboardData>>["openFeedback"]) {
  if (!items.length) return `<tr><td colspan="6" class="empty">No open feedback.</td></tr>`;
  return items
    .map(
      (item) => `<tr>
        <td>#${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.displayName ?? item.userId)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td>${escapeHtml(item.content).slice(0, 240)}</td>
        <td>${escapeHtml(item.pageContext ?? "—")}</td>
        <td>${escapeHtml(item.createdAt)}</td>
      </tr>`,
    )
    .join("");
}

function seedNoteRows(items: Awaited<ReturnType<typeof getAdminOpsDashboardData>>["seedNotes"]) {
  if (!items.length) return `<tr><td colspan="9" class="empty">No seed user follow-up notes yet.</td></tr>`;
  return items
    .map(
      (item) => `<tr>
        <td>#${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.displayName ?? item.userId)}</td>
        <td>${escapeHtml(item.noteType)}</td>
        <td>${escapeHtml(item.completionSource ?? "—")}</td>
        <td>${escapeHtml(item.failureReason ?? "—")}</td>
        <td>${escapeHtml(item.status)}</td>
        <td>${escapeHtml(item.content).slice(0, 220)}</td>
        <td>${escapeHtml(item.recordedBy ?? "—")}</td>
        <td>${escapeHtml(item.recordedOn)}</td>
      </tr>`,
    )
    .join("");
}

function reminderEventRows(
  items: Awaited<ReturnType<typeof getAdminOpsDashboardData>>["recentReminderEvents"],
) {
  if (!items.length) return `<tr><td colspan="8" class="empty">No reminder events yet.</td></tr>`;
  return items
    .map(
      (item) => `<tr>
        <td>#${escapeHtml(item.id)}</td>
        <td>L${escapeHtml(item.level)}</td>
        <td>${escapeHtml(item.displayName ?? "—")}</td>
        <td>${escapeHtml(item.deliveryStatus)}</td>
        <td>${escapeHtml(item.sentAt)}</td>
        <td>${escapeHtml(item.deliveredAt ?? "—")}</td>
        <td>${escapeHtml(item.clickedAt ?? "—")}</td>
        <td>${escapeHtml(item.completedAt ?? "—")}</td>
      </tr>`,
    )
    .join("");
}

function renderOps(data: Awaited<ReturnType<typeof getAdminOpsDashboardData>>) {
  const validationUrl = "/api/academy/admin/bot/validation-dashboard";
  const courseReviewUrl = "/api/academy/admin/course-review";
  return `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Academy Admin Ops Dashboard</title>
  <style>
    :root { --ink:#20221d; --muted:#74746a; --paper:#f6f1e7; --card:#fffaf0; --line:#d9d0bd; --accent:#b8664d; --green:#4f7a58; --red:#a14f49; --gold:#a48250; }
    body { margin:0; font-family: ui-serif, Georgia, "Times New Roman", serif; background:var(--paper); color:var(--ink); }
    main { max-width:1180px; margin:0 auto; padding:32px 20px 56px; }
    header { display:flex; justify-content:space-between; gap:20px; align-items:flex-end; border-bottom:1px solid var(--line); padding-bottom:20px; margin-bottom:24px; }
    h1 { margin:0; font-size:clamp(34px,5vw,64px); line-height:.95; letter-spacing:-.05em; }
    h2 { margin:0 0 12px; font-size:22px; }
    p, small { color:var(--muted); line-height:1.65; }
    a { color:var(--accent); }
    .eyebrow, .metric-card span { display:block; color:var(--accent); font:700 12px/1.2 ui-sans-serif, system-ui; letter-spacing:.18em; text-transform:uppercase; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px; margin:18px 0 28px; }
    .metric-card, section { background:rgba(255,250,240,.72); border:1px solid var(--line); padding:18px; box-shadow:0 10px 30px rgba(32,34,29,.04); }
    .metric-card strong { display:block; font-size:34px; margin:10px 0 4px; letter-spacing:-.04em; }
    .sections { display:grid; gap:18px; }
    table { width:100%; border-collapse:collapse; font:14px/1.45 ui-sans-serif, system-ui; }
    th, td { text-align:left; padding:11px 9px; border-bottom:1px solid var(--line); vertical-align:middle; }
    th { color:var(--muted); font-weight:700; }
    .empty { color:var(--muted); text-align:center; padding:26px; }
    .pill { display:inline-block; padding:4px 8px; border:1px solid var(--line); text-transform:uppercase; font-size:11px; letter-spacing:.12em; }
    .pill.is-high { color:var(--red); border-color:var(--red); }
    .pill.is-medium { color:var(--gold); border-color:var(--gold); }
    .pill.is-low { color:var(--green); border-color:var(--green); }
    code { background:#eee5d6; padding:2px 6px; border-radius:4px; }
    @media (max-width: 760px) { header { display:block; } table { font-size:12px; } th, td { padding:9px 5px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <span class="eyebrow">Academy Admin</span>
        <h1>Ops<br />Dashboard</h1>
        <p>轻后台入口：学习状态、支付审计、邀请风险、开放复习/反馈和项目抽查。更多留存与提醒转化见 <a href="${validationUrl}">Validation Dashboard</a>；课程版本与翻译审核见 <a href="${courseReviewUrl}">Course Review Center</a>。</p>
      </div>
      <p>Updated<br /><code>${escapeHtml(new Date().toISOString())}</code></p>
    </header>

    <div class="grid">
      ${metricCard("Learners", data.learners.length, "最近有学习或注册记录的用户")}
      ${metricCard("Open Reviews", data.openReviews.length, "待处理复习 / 开放项")}
      ${metricCard("Open Feedback", data.openFeedback.length, "种子用户反馈")}
      ${metricCard("Seed Notes", data.seedNotes.length, "follow-up / failure reason log")}
      ${metricCard("Risk Invitations", data.riskyInvitations.length, "pending / rejected / 非低风险邀请")}
      ${metricCard("Payment Orders", data.payments.length, "最近支付订单")}
      ${metricCard("Pending Project Reviews", data.validation.pendingProjectReviews.length, "毕业/里程碑人工抽查")}
      ${metricCard("Reminder Health", data.reminderHealth.status, `${data.reminderHealth.delivered24h}/${data.reminderHealth.total24h} delivered in 24h`)}
    </div>

    <div class="sections">
      <section>
        <h2>Reminder Delivery Health</h2>
        <p>用于排查“页面显示连续中断，但 Telegram 没收到提醒”。如果 24 小时无事件，先检查 <code>academy-reminders.timer</code>；如果 failed 增加，先查 Bot token、用户是否拉黑 Bot、Telegram chat ID。</p>
        <div class="grid">
          ${metricCard("24h Total", data.reminderHealth.total24h, `last sent: ${data.reminderHealth.lastSentAt ?? "—"}`)}
          ${metricCard("Delivered", data.reminderHealth.delivered24h, `last delivered: ${data.reminderHealth.lastDeliveredAt ?? "—"}`)}
          ${metricCard("Failed", data.reminderHealth.failed24h, "Telegram 投递失败")}
          ${metricCard("Opened / Completed", `${data.reminderHealth.opened24h}/${data.reminderHealth.completed24h}`, "点击提醒 / 提醒后完成")}
        </div>
        <table>
          <thead><tr><th>ID</th><th>Level</th><th>User</th><th>Status</th><th>Sent</th><th>Delivered</th><th>Clicked</th><th>Completed</th></tr></thead>
          <tbody>${reminderEventRows(data.recentReminderEvents)}</tbody>
        </table>
      </section>

      <section>
        <h2>User Learning Status</h2>
        <table>
          <thead><tr><th>User</th><th>Telegram</th><th>Courses</th><th>Max Day</th><th>Evidence</th><th>Last Evidence</th><th>Reminder</th></tr></thead>
          <tbody>${learnerRows(data.learners)}</tbody>
        </table>
      </section>

      <section>
        <h2>Payment Orders & Refund Audit</h2>
        <p>只读审计视图。退款仍必须通过 Telegram charge ID 和人工确认流程处理，不在这里一键操作。</p>
        <table>
          <thead><tr><th>Order</th><th>User</th><th>Plan</th><th>Stars</th><th>Order</th><th>Txn</th><th>Charge</th><th>Time</th></tr></thead>
          <tbody>${paymentRows(data.payments)}</tbody>
        </table>
      </section>

      <section>
        <h2>Invitation Risk Review</h2>
        <p>处理入口：<code>POST /api/academy/admin/invitations</code>，支持 approve / reject / revoke_reward。</p>
        <table>
          <thead><tr><th>ID</th><th>Inviter</th><th>Invited</th><th>Risk</th><th>Status</th><th>Reason</th><th>Reward</th><th>Created</th></tr></thead>
          <tbody>${invitationRows(data.riskyInvitations)}</tbody>
        </table>
      </section>

      <section>
        <h2>Open Review Queue</h2>
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Source</th><th>Reason</th><th>Title</th><th>Due</th><th>Created</th></tr></thead>
          <tbody>${reviewRows(data.openReviews)}</tbody>
        </table>
      </section>

      <section>
        <h2>Open Feedback</h2>
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Category</th><th>Content</th><th>Page</th><th>Created</th></tr></thead>
          <tbody>${feedbackRows(data.openFeedback)}</tbody>
        </table>
      </section>

      <section>
        <h2>Seed User Follow-up Notes</h2>
        <p>Protected JSON endpoint: <code>POST /api/academy/admin/ops-dashboard</code>. Use it to record why a seed user completed, stopped, paid, or refused to pay. Completion source accepts <code>self</code>, <code>reminder</code>, <code>strong_supervision</code>, <code>unknown</code>.</p>
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Type</th><th>Source</th><th>Reason</th><th>Status</th><th>Content</th><th>By</th><th>Date</th></tr></thead>
          <tbody>${seedNoteRows(data.seedNotes)}</tbody>
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
    const data = await getAdminOpsDashboardData();
    return new Response(renderOps(data), {
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

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const body = await request.json();
    const note = await createSeedUserNote({
      userId: String(body?.userId ?? ""),
      noteType: typeof body?.noteType === "string" ? body.noteType : null,
      completionSource:
        typeof body?.completionSource === "string" ? body.completionSource : null,
      failureReason:
        typeof body?.failureReason === "string" ? body.failureReason : null,
      status: typeof body?.status === "string" ? body.status : null,
      content: String(body?.content ?? ""),
      recordedBy: typeof body?.recordedBy === "string" ? body.recordedBy : null,
      recordedOn: typeof body?.recordedOn === "string" ? body.recordedOn : null,
    });
    return Response.json({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
