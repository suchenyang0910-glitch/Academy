import {
  handleCourseQualityEvent,
  importLocalizationDrafts,
  listCourseContentReviewCenter,
  reviewCourseContentVersion,
  reviewLessonLocalization,
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

function statusPill(status: string) {
  return `<span class="pill is-${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function versionRows(data: Awaited<ReturnType<typeof listCourseContentReviewCenter>>) {
  if (!data.versions.length) {
    return `<tr><td colspan="10" class="empty">No course versions yet. Run migrations and seed first.</td></tr>`;
  }
  return data.versions
    .map(
      (item) => `<tr>
        <td>#${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.courseTitle)}<br /><small>${escapeHtml(item.courseSlug)}</small></td>
        <td>${escapeHtml(item.version)}</td>
        <td>${statusPill(item.status)}</td>
        <td>${escapeHtml(item.lessonCount)}</td>
        <td>${escapeHtml(item.approvedLocaleCount)}</td>
        <td>${escapeHtml(item.draftLocaleCount)}</td>
        <td>${escapeHtml(item.missingLocaleCount)}</td>
        <td>${escapeHtml(item.reviewedBy ?? "—")}<br /><small>${escapeHtml(item.reviewedAt ?? "—")}</small></td>
        <td>${escapeHtml(item.updatedAt)}</td>
      </tr>`,
    )
    .join("");
}

function localizationRows(data: Awaited<ReturnType<typeof listCourseContentReviewCenter>>) {
  if (!data.lessonReviews.length) {
    return `<tr><td colspan="8" class="empty">No lesson localization items.</td></tr>`;
  }
  return data.lessonReviews
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.courseTitle)}</td>
        <td>Day ${escapeHtml(item.day)}</td>
        <td>${escapeHtml(item.sourceTitle)}</td>
        <td>${escapeHtml(item.locale)}</td>
        <td>${escapeHtml(item.localizedTitle ?? "缺翻译")}</td>
        <td>${statusPill(item.reviewStatus)}</td>
        <td>${escapeHtml(item.sourceVersion)}</td>
        <td>${escapeHtml(item.reviewedAt ?? item.updatedAt ?? "—")}</td>
      </tr>`,
    )
    .join("");
}

function qualityRows(data: Awaited<ReturnType<typeof listCourseContentReviewCenter>>) {
  if (!data.qualityEvents.length) {
    return `<tr><td colspan="8" class="empty">No open quality signals. Tiny miracle, or nobody has suffered through the quiz yet.</td></tr>`;
  }
  return data.qualityEvents
    .map((item) => {
      const firstPassRate =
        typeof item.metrics.firstPassRate === "number"
          ? `${item.metrics.firstPassRate}%`
          : "—";
      const firstAttemptCount =
        typeof item.metrics.firstAttemptCount === "number"
          ? item.metrics.firstAttemptCount
          : "—";
      return `<tr>
        <td>${escapeHtml(item.courseTitle)}</td>
        <td>${item.lessonDay ? `Day ${escapeHtml(item.lessonDay)}` : "—"}</td>
        <td>${escapeHtml(item.lessonTitle ?? item.lessonId ?? "—")}</td>
        <td>${statusPill(item.severity)}</td>
        <td>${escapeHtml(item.eventType)}</td>
        <td>${escapeHtml(firstAttemptCount)} / ${escapeHtml(firstPassRate)}</td>
        <td>${escapeHtml(item.recommendation)}</td>
        <td>${escapeHtml(item.updatedAt)}</td>
      </tr>`;
    })
    .join("");
}

function renderCourseReview(data: Awaited<ReturnType<typeof listCourseContentReviewCenter>>) {
  const localeLinks = data.supportedLocales
    .map((locale) => `<a href="?locale=${escapeHtml(locale)}">${escapeHtml(locale)}</a>`)
    .join(" / ");
  return `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Academy Course Review Center</title>
  <style>
    :root { --ink:#20221d; --muted:#74746a; --paper:#f6f1e7; --line:#d9d0bd; --accent:#b8664d; --green:#4f7a58; --red:#a14f49; --gold:#a48250; }
    body { margin:0; font-family: ui-serif, Georgia, "Times New Roman", serif; background:var(--paper); color:var(--ink); }
    main { max-width:1180px; margin:0 auto; padding:32px 20px 56px; }
    header { border-bottom:1px solid var(--line); padding-bottom:20px; margin-bottom:24px; }
    h1 { margin:0; font-size:clamp(34px,5vw,64px); line-height:.95; letter-spacing:-.05em; }
    h2 { margin:0 0 12px; font-size:22px; }
    p, small { color:var(--muted); line-height:1.65; }
    a { color:var(--accent); }
    .eyebrow { display:block; color:var(--accent); font:700 12px/1.2 ui-sans-serif, system-ui; letter-spacing:.18em; text-transform:uppercase; }
    section { background:rgba(255,250,240,.72); border:1px solid var(--line); padding:18px; margin-bottom:18px; box-shadow:0 10px 30px rgba(32,34,29,.04); }
    table { width:100%; border-collapse:collapse; font:14px/1.45 ui-sans-serif, system-ui; }
    th, td { text-align:left; padding:11px 9px; border-bottom:1px solid var(--line); vertical-align:middle; }
    th { color:var(--muted); font-weight:700; }
    .empty { color:var(--muted); text-align:center; padding:26px; }
    .pill { display:inline-block; padding:4px 8px; border:1px solid var(--line); text-transform:uppercase; font-size:11px; letter-spacing:.12em; }
    .pill.is-published, .pill.is-approved { color:var(--green); border-color:var(--green); }
    .pill.is-pending_review, .pill.is-draft, .pill.is-missing { color:var(--gold); border-color:var(--gold); }
    .pill.is-rejected, .pill.is-archived { color:var(--red); border-color:var(--red); }
    code { background:#eee5d6; padding:2px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <main>
    <header>
      <span class="eyebrow">Academy Admin</span>
      <h1>Course<br />Review Center</h1>
      <p>课程版本、翻译版本、审核状态后台。用户端只读取 approved 翻译；缺翻译时继续回退中文审核版，不用未审核机器翻译冒充正式内容。</p>
      <p>Locale: <code>${escapeHtml(data.locale)}</code> · Switch: ${localeLinks}</p>
      <p>Review API: <code>POST /api/academy/admin/course-review</code>，actions: <code>review_course_version</code>, <code>review_lesson_localization</code>, <code>handle_quality_event</code>, <code>import_localization_draft</code></p>
      <p>Import rule: localization import only creates draft / pending_review content. Approved translations are skipped by default, so half-baked machine translations cannot quietly replace production lessons.</p>
    </header>

    <section>
      <h2>Course Content Versions</h2>
      <table>
        <thead><tr><th>ID</th><th>Course</th><th>Version</th><th>Status</th><th>Lessons</th><th>Approved i18n</th><th>Draft i18n</th><th>Missing i18n</th><th>Reviewed</th><th>Updated</th></tr></thead>
        <tbody>${versionRows(data)}</tbody>
      </table>
    </section>

    <section>
      <h2>Lesson Translation Review</h2>
      <table>
        <thead><tr><th>Course</th><th>Day</th><th>Source</th><th>Locale</th><th>Localized Title</th><th>Status</th><th>Source Version</th><th>Reviewed / Updated</th></tr></thead>
        <tbody>${localizationRows(data)}</tbody>
      </table>
    </section>

    <section>
      <h2>Quality Signals</h2>
      <p>来自真实学习数据的内容改版线索。选择题提交后会即时聚合该 lesson 的首交表现：首交样本达到 3 次且通过率低于 60% 时，自动记录为 open quality event。</p>
      <table>
        <thead><tr><th>Course</th><th>Day</th><th>Lesson</th><th>Severity</th><th>Type</th><th>Attempts / First Pass</th><th>Recommendation</th><th>Updated</th></tr></thead>
        <tbody>${qualityRows(data)}</tbody>
      </table>
      <p>处理动作：<code>resolved</code> 关闭事件；<code>needs_rewrite</code> 保持待改写；<code>create_new_version</code> 创建或复用该质量事件对应的 draft 课程版本，并在 metrics 中记录 rewriteTarget，避免重复点击生成多个幽灵版本。</p>
    </section>
  </main>
</body>
</html>`;
}

export async function GET(request: Request) {
  try {
    verifyCronSecret(request);
    const url = new URL(request.url);
    const data = await listCourseContentReviewCenter({
      locale: url.searchParams.get("locale"),
      status: url.searchParams.get("status"),
      limit: Number(url.searchParams.get("limit") ?? 80),
    });
    if (url.searchParams.get("format") === "json") return Response.json(data);
    return new Response(renderCourseReview(data), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GET /api/academy/admin/course-review failed", error);
    return new Response("course review center failed", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
      versionId?: number;
      lessonId?: string;
      locale?: string;
      status?: string;
      eventId?: number;
      qualityAction?: "resolved" | "needs_rewrite" | "create_new_version";
      reviewedBy?: string | null;
      handledBy?: string | null;
      changeSummary?: string | null;
      note?: string | null;
      sourceVersion?: string | null;
      importedBy?: string | null;
      allowOverwriteApproved?: boolean;
      courses?: Parameters<typeof importLocalizationDrafts>[0]["courses"];
      lessons?: Parameters<typeof importLocalizationDrafts>[0]["lessons"];
    };

    if (payload.action === "review_course_version") {
      const version = await reviewCourseContentVersion({
        versionId: Number(payload.versionId),
        status: payload.status ?? "draft",
        reviewedBy: payload.reviewedBy,
        changeSummary: payload.changeSummary,
      });
      return Response.json({ version });
    }

    if (payload.action === "review_lesson_localization") {
      const localization = await reviewLessonLocalization({
        lessonId: payload.lessonId ?? "",
        locale: payload.locale ?? "zh-Hans",
        status: payload.status ?? "draft",
      });
      return Response.json({ localization });
    }

    if (payload.action === "handle_quality_event") {
      const qualityEvent = await handleCourseQualityEvent({
        eventId: Number(payload.eventId),
        action: payload.qualityAction ?? "needs_rewrite",
        handledBy: payload.handledBy ?? payload.reviewedBy,
        note: payload.note ?? payload.changeSummary,
      });
      return Response.json({ qualityEvent });
    }

    if (payload.action === "import_localization_draft") {
      const importResult = await importLocalizationDrafts({
        locale: payload.locale,
        sourceVersion: payload.sourceVersion,
        importedBy: payload.importedBy ?? payload.reviewedBy,
        allowOverwriteApproved: payload.allowOverwriteApproved,
        reviewStatus: payload.status,
        courses: payload.courses,
        lessons: payload.lessons,
      });
      return Response.json({ import: importResult });
    }

    return Response.json({ error: "unsupported action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/academy/admin/course-review failed", error);
    return Response.json({ error: "course review update failed" }, { status: 500 });
  }
}
