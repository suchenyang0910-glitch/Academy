"use client";

import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        openTelegramLink?: (url: string) => void;
        openInvoice?: (
          url: string,
          callback?: (
            status: "paid" | "cancelled" | "failed" | "pending",
          ) => void,
        ) => void;
      };
    };
  }
}

type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  dailyMinutes: number;
  durationDays: number;
  accent: string;
  status: string;
};

type Enrollment = {
  id: number;
  courseId: string;
  currentDay: number;
  active: number;
  title: string;
  slug: string;
  accent: string;
  dailyMinutes: number;
};

type Lesson = {
  id: string;
  courseId: string;
  day: number;
  level: number;
  round: number;
  title: string;
  objective: string;
  content: string;
  practicePrompt: string;
  criteria: string[];
  estimatedMinutes: number;
};

type Submission = {
  lessonId: string;
  status: string;
  ruleScore: number;
  ruleFeedback?: string;
  aiFeedback?: string | null;
  completionSource?: string;
};

type TodayItem = {
  enrollment: Enrollment;
  lesson: Lesson | null;
  submission: Submission | null;
};

type Note = {
  id: number;
  lessonId: string | null;
  content: string;
  createdAt: string;
};

type Bootstrap = {
  user: {
    id: string;
    telegramId: string | null;
    displayName: string;
    telegramUsername: string | null;
    firstName: string | null;
    lastName: string | null;
    languageCode: string | null;
    photoUrl: string | null;
    isPremium: boolean;
    timezone: string;
    trialStartedAt: string;
  };
  referral: {
    code: string;
    total: number;
    pending: number;
    qualified: number;
    rewardTarget: number;
    rewardDays: number;
    earnedRewards: number;
    nextRewardRemaining: number;
    shareUrl: string | null;
  };
  access: {
    active: boolean;
    state: "trial" | "paid" | "reward" | "expired";
    trialStartedAt: string;
    trialEndsAt: string;
    accessEndsAt: string;
    daysRemaining: number;
    planKey: string | null;
  };
  payment: {
    provider: "telegram_stars";
    currency: "XTR";
    enabled: boolean;
    webhookConfigured: boolean;
    plans: Array<{
      key: "monthly" | "quarterly" | "half_year" | "yearly";
      label: string;
      usdPrice: string;
      durationDays: number;
      recurring: boolean;
      stars: number | null;
      enabled: boolean;
    }>;
  };
  catalog: CatalogCourse[];
  enrollments: Enrollment[];
  today: TodayItem[];
  notes: Note[];
  supervision: {
    todayKey: string;
    timezone: string;
    allCompleted: boolean;
    lagDays: number;
    state: "completed" | "interrupted" | "behind" | "on_track";
  };
};

type Tab = "today" | "courses" | "notes" | "progress" | "profile";

function academyHeaders() {
  const referralCode =
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("ref") ?? "";
  return {
    "content-type": "application/json",
    "x-telegram-init-data": window.Telegram?.WebApp?.initData ?? "",
    "x-academy-ref": referralCode,
  };
}

async function academyRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...academyHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || "请求失败，请稍后重试");
  }
  return response.json() as Promise<T>;
}

export default function Home() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("today");
  const [selected, setSelected] = useState<TodayItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const bootstrap = await academyRequest<Bootstrap>("/api/academy/bootstrap");
      setData(bootstrap);
      if (bootstrap.enrollments.length === 0 && bootstrap.access.active) {
        setPickerOpen(true);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "加载失败",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
    queueMicrotask(() => void load());
  }, [load]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function openCoursePicker() {
    if (!data?.access.active) {
      setTab("profile");
      notify("试用已结束，先处理使用权限");
      return;
    }
    setPickerOpen(true);
  }

  const completedCount =
    data?.today.filter((item) => item.submission?.status === "completed").length ??
    0;
  const totalCount = data?.today.length ?? 0;
  const progress =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <main className="app-shell">
      <section className="phone" aria-label="Academy Telegram Mini App">
        <div className="paper-grain" aria-hidden="true" />
        <header className="topbar">
          <div className="brand-mark" aria-hidden="true">
            A
          </div>
          <div className="brand-copy">
            <strong>ACADEMY</strong>
            <span>学习监督系统</span>
          </div>
          <button
            className="day-chip"
            type="button"
            onClick={() => setTab("progress")}
          >
            DAY {String(data?.enrollments[0]?.currentDay ?? 1).padStart(2, "0")}
          </button>
        </header>

        <div className="content">
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={load} />}
          {!loading && data && (
            <>
              {!data.access.active && tab !== "profile" && (
                <ExpiredBanner onOpenPlans={() => setTab("profile")} />
              )}
              {tab === "today" && (
                <TodayView
                  data={data}
                  progress={progress}
                  completedCount={completedCount}
                  onSelect={(item) =>
                    data.access.active ? setSelected(item) : setTab("profile")
                  }
                  onOpenPicker={openCoursePicker}
                />
              )}
              {tab === "courses" && (
                <CoursesView
                  catalog={data.catalog}
                  enrollments={data.enrollments}
                  onEdit={openCoursePicker}
                />
              )}
              {tab === "notes" && (
                <NotesView
                  notes={data.notes}
                  accessActive={data.access.active}
                  onSaved={(note) => {
                    setData((current) =>
                      current
                        ? { ...current, notes: [note, ...current.notes] }
                        : current,
                    );
                    notify("笔记已经收好");
                  }}
                />
              )}
              {tab === "progress" && (
                <ProgressView
                  data={data}
                  progress={progress}
                  completedCount={completedCount}
                />
              )}
              {tab === "profile" && (
                <ProfileView
                  data={data}
                  notify={notify}
                  onPaymentFinished={load}
                />
              )}
            </>
          )}
        </div>

        <nav className="bottom-nav bottom-nav-five" aria-label="主要导航">
          <NavButton
            active={tab === "today"}
            icon="⌂"
            label="今日"
            onClick={() => setTab("today")}
          />
          <NavButton
            active={tab === "courses"}
            icon="≡"
            label="课程"
            onClick={() => setTab("courses")}
          />
          <NavButton
            active={tab === "notes"}
            icon="▤"
            label="笔记"
            onClick={() => setTab("notes")}
          />
          <NavButton
            active={tab === "progress"}
            icon="▥"
            label="进度"
            onClick={() => setTab("progress")}
          />
          <NavButton
            active={tab === "profile"}
            icon="○"
            label="我的"
            onClick={() => setTab("profile")}
          />
        </nav>

        {data && pickerOpen && (
          <CoursePicker
            catalog={data.catalog}
            initialIds={data.enrollments.map((item) => item.courseId)}
            required={data.enrollments.length === 0}
            onClose={() => setPickerOpen(false)}
            onSaved={(next) => {
              setData(next);
              setPickerOpen(false);
              notify("课程安排已更新");
            }}
          />
        )}

        {selected?.lesson && (
          <LessonSheet
            item={selected}
            onClose={() => setSelected(null)}
            onSubmitted={(submission) => {
              setData((current) =>
                current
                  ? {
                      ...current,
                      today: current.today.map((item) =>
                        item.lesson?.id === selected.lesson?.id
                          ? { ...item, submission }
                          : item,
                      ),
                    }
                  : current,
              );
              setSelected((current) =>
                current ? { ...current, submission } : current,
              );
              notify(
                submission.status === "completed"
                  ? "这节课有证据了"
                  : "已保存，按反馈修正后再提交",
              );
            }}
          />
        )}

        {toast && <div className="toast">{toast}</div>}
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="loading-mark">A</span>
      <strong>正在整理今天的学习</strong>
      <p>课程不会自己完成，但页面可以先自己加载。</p>
    </div>
  );
}

function ExpiredBanner({ onOpenPlans }: { onOpenPlans: () => void }) {
  return (
    <section className="expired-banner" role="status">
      <div>
        <span>试用已结束</span>
        <p>历史记录仍可查看。继续提交课程需要订阅或有效邀请奖励。</p>
      </div>
      <button type="button" onClick={onOpenPlans}>
        查看方案
      </button>
    </section>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="error-state">
      <span>连接暂时走神了</span>
      <h1>今天的课程还在，数据没跟上。</h1>
      <p>{message}</p>
      <button className="primary-button" type="button" onClick={onRetry}>
        再试一次
      </button>
    </div>
  );
}

function TodayView({
  data,
  progress,
  completedCount,
  onSelect,
  onOpenPicker,
}: {
  data: Bootstrap;
  progress: number;
  completedCount: number;
  onSelect: (item: TodayItem) => void;
  onOpenPicker: () => void;
}) {
  const minutes = data.enrollments.reduce(
    (sum, item) => sum + item.dailyMinutes,
    0,
  );

  return (
    <>
      <section className="hero">
        <p className="greeting">你好，{data.user.displayName}</p>
        <h1>今日学习</h1>
        <p className="date-line">
          {new Intl.DateTimeFormat("zh-CN", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }).format(new Date())}
          {" · "}
          预计 {minutes} 分钟
        </p>
        <div className="progress-summary">
          <div className="progress-copy">
            <span>今日完成</span>
            <strong>
              {completedCount}
              <small> / {data.today.length}</small>
            </strong>
          </div>
          <div
            className="progress-ring"
            style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
            aria-label={`今日学习进度 ${progress}%`}
          >
            <div>{progress}%</div>
          </div>
        </div>
      </section>

      <section
        className={`supervision-note supervision-${data.supervision.state}`}
      >
        <span>{supervisionCopy(data.supervision).label}</span>
        <p>{supervisionCopy(data.supervision).message}</p>
      </section>

      <section className="lesson-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TODAY&apos;S WORK</span>
            <h2>{data.today.length ? "必须留下输出" : "先选择课程"}</h2>
          </div>
          <button className="text-button" type="button" onClick={onOpenPicker}>
            调整课程
          </button>
        </div>

        {data.today.length === 0 ? (
          <button className="empty-course" type="button" onClick={onOpenPicker}>
            <strong>选择 1–3 门课程</strong>
            <span>每门每天 15–20 分钟</span>
          </button>
        ) : (
          <div className="lesson-list">
            {data.today.map((item, index) => {
              const done = item.submission?.status === "completed";
              return (
                <article
                  className={`lesson-row ${done ? "is-done" : ""}`}
                  key={item.enrollment.id}
                  style={
                    {
                      "--lesson-accent": item.enrollment.accent,
                    } as React.CSSProperties
                  }
                >
                  <button
                    className="lesson-main"
                    type="button"
                    onClick={() => item.lesson && onSelect(item)}
                    disabled={!item.lesson}
                  >
                    <span className="lesson-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="lesson-copy">
                      <strong>{item.enrollment.title}</strong>
                      <span>
                        {item.lesson?.title ?? "课程内容正在准备，先别假装完成"}
                      </span>
                    </span>
                    <span className="lesson-arrow" aria-hidden="true">
                      ›
                    </span>
                  </button>
                  <span className={`evidence-state ${done ? "done" : ""}`}>
                    {done ? "✓" : "·"}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <blockquote>
        “完成不是点一下按钮，而是留下一个以后还能检查的结果。”
      </blockquote>
    </>
  );
}

function CoursePicker({
  catalog,
  initialIds,
  required,
  onClose,
  onSaved,
}: {
  catalog: CatalogCourse[];
  initialIds: string[];
  required: boolean;
  onClose: () => void;
  onSaved: (data: Bootstrap) => void;
}) {
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedCourses = catalog.filter((course) =>
    selectedIds.includes(course.id),
  );
  const minutes = selectedCourses.reduce(
    (sum, course) => sum + course.dailyMinutes,
    0,
  );

  function toggle(courseId: string) {
    setError("");
    setSelectedIds((current) => {
      if (current.includes(courseId)) {
        return current.filter((id) => id !== courseId);
      }
      if (current.length >= 3) {
        setError("最多同时选择 3 门课程");
        return current;
      }
      return [...current, courseId];
    });
  }

  async function save() {
    if (selectedIds.length < 1) {
      setError("至少选择 1 门课程");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const next = await academyRequest<Bootstrap>(
        "/api/academy/enrollments",
        {
          method: "POST",
          body: JSON.stringify({ courseIds: selectedIds }),
        },
      );
      onSaved(next);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "保存失败",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="full-screen-panel">
      <header className="picker-header">
        <div>
          <span className="eyebrow">YOUR 60-DAY PATH</span>
          <h1>选择训练方向</h1>
          <p>必选 1 门，最多 3 门，可以中途更换。</p>
        </div>
        {!required && (
          <button className="text-button" type="button" onClick={onClose}>
            取消
          </button>
        )}
      </header>

      <div className="course-picker-list">
        {catalog.map((course) => {
          const checked = selectedIds.includes(course.id);
          return (
            <button
              className={`course-choice ${checked ? "selected" : ""}`}
              type="button"
              key={course.id}
              onClick={() => toggle(course.id)}
              style={{ "--course-accent": course.accent } as React.CSSProperties}
              aria-pressed={checked}
            >
              <span className="choice-check">{checked ? "✓" : ""}</span>
              <span className="choice-copy">
                <small>{course.subtitle}</small>
                <strong>{course.title}</strong>
                <span>{course.summary}</span>
              </span>
              <span className="choice-time">{course.dailyMinutes} min</span>
            </button>
          );
        })}
      </div>

      <footer className="picker-footer">
        <div>
          <span>已选 {selectedIds.length}/3 门</span>
          <strong>每天约 {minutes} 分钟</strong>
        </div>
        {error && <p>{error}</p>}
        <button
          className="primary-button"
          type="button"
          onClick={save}
          disabled={saving}
        >
          {saving ? "正在安排…" : "开始 60 天训练"}
        </button>
      </footer>
    </div>
  );
}

function CoursesView({
  catalog,
  enrollments,
  onEdit,
}: {
  catalog: CatalogCourse[];
  enrollments: Enrollment[];
  onEdit: () => void;
}) {
  const activeIds = new Set(enrollments.map((item) => item.courseId));
  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">COURSE CATALOG</span>
        <h1>课程</h1>
        <p>每门课程独立计算 Day，换课不会删除过去的证据。</p>
      </section>
      <div className="catalog-list">
        {catalog.map((course) => {
          const active = activeIds.has(course.id);
          return (
            <article
              className="catalog-card"
              key={course.id}
              style={{ "--course-accent": course.accent } as React.CSSProperties}
            >
              <span>{course.subtitle}</span>
              <h2>{course.title}</h2>
              <p>{course.summary}</p>
              <div>
                <strong>{course.durationDays} DAYS</strong>
                <small>{course.dailyMinutes} 分钟／天</small>
                <em>{active ? "训练中" : "未选择"}</em>
              </div>
            </article>
          );
        })}
      </div>
      <button className="new-note-button" type="button" onClick={onEdit}>
        调整我的课程
      </button>
    </>
  );
}

function LessonSheet({
  item,
  onClose,
  onSubmitted,
}: {
  item: TodayItem;
  onClose: () => void;
  onSubmitted: (submission: Submission) => void;
}) {
  const lesson = item.lesson!;
  const [answer, setAnswer] = useState("");
  const [submission, setSubmission] = useState(item.submission);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const result = await academyRequest<{ submission: Submission }>(
        "/api/academy/submissions",
        {
          method: "POST",
          body: JSON.stringify({
            enrollmentId: item.enrollment.id,
            lessonId: lesson.id,
            answer,
            completionSource: "self",
          }),
        },
      );
      setSubmission(result.submission);
      onSubmitted(result.submission);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "提交失败",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lesson-page">
      <header className="lesson-page-header">
        <button type="button" onClick={onClose}>
          ‹ 返回今日
        </button>
        <span>
          DAY {String(lesson.day).padStart(2, "0")} · {lesson.estimatedMinutes} MIN
        </span>
      </header>
      <div className="lesson-page-content">
        <p className="lesson-kicker">
          {item.enrollment.title.toUpperCase()} · ROUND {lesson.round}
        </p>
        <h1>{lesson.title}</h1>

        <section className="objective-block">
          <span>今天的目标</span>
          <p>{lesson.objective}</p>
        </section>

        <section className="lesson-reading">
          <span className="eyebrow">必要输入</span>
          <p>{lesson.content}</p>
        </section>

        <section className="practice-card">
          <span className="eyebrow">ACTIVE PRACTICE</span>
          <h2>必须留下输出</h2>
          <p>{lesson.practicePrompt}</p>
          <div className="criteria-row">
            {lesson.criteria.map((criterion) => (
              <span key={criterion}>{criterion}</span>
            ))}
          </div>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="写下你的原始答案。系统会保留它，不让 AI 替你假装学会。"
            maxLength={4000}
          />
          <div className="answer-meta">
            <span>{answer.trim().length} 字</span>
            {error && <strong>{error}</strong>}
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "正在检查…" : submission ? "修正后重新提交" : "提交学习证据"}
          </button>
        </section>

        {submission && (
          <section
            className={`feedback-card ${
              submission.status === "completed" ? "passed" : ""
            }`}
          >
            <div>
              <span>规则评分</span>
              <strong>{Math.round(submission.ruleScore)}</strong>
            </div>
            <p>{submission.ruleFeedback}</p>
            <div className="ai-feedback">
              <span>OLLAMA 点评</span>
              <p>
                {submission.aiFeedback ||
                  "本地模型暂时没有回应。规则评分已保存，不影响今天的学习。"}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function NotesView({
  notes,
  accessActive,
  onSaved,
}: {
  notes: Note[];
  accessActive: boolean;
  onSaved: (note: Note) => void;
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const result = await academyRequest<{ note: Note }>("/api/academy/notes", {
        method: "POST",
        body: JSON.stringify({ content: draft }),
      });
      setDraft("");
      onSaved(result.note);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "保存失败",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">LEARNING NOTES</span>
        <h1>学习笔记</h1>
        <p>不是收藏内容，而是保存你自己的判断。</p>
      </section>
      {accessActive ? (
        <section className="inline-composer">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="一个发现、一次判断，或明天必须继续的问题…"
            maxLength={2000}
          />
          <div>
            <span>{draft.length}/2000</span>
            {error && <strong>{error}</strong>}
            <button
              className="primary-button"
              type="button"
              onClick={save}
              disabled={saving || !draft.trim()}
            >
              {saving ? "保存中…" : "保存笔记"}
            </button>
          </div>
        </section>
      ) : (
        <p className="locked-composer">
          试用结束后仍可查看历史笔记，但不能继续新增学习记录。
        </p>
      )}
      <section className="timeline note-timeline">
        {notes.length === 0 && (
          <p className="empty-note">还没有笔记。大脑觉得记得住，通常只是它的个人意见。</p>
        )}
        {notes.map((note) => (
          <article className="note-entry" key={note.id}>
            <div className="timeline-dot" aria-hidden="true" />
            <div className="note-meta">
              <span>LEARNING NOTE</span>
              <time>{formatDate(note.createdAt)}</time>
            </div>
            <p>{note.content}</p>
          </article>
        ))}
      </section>
    </>
  );
}

function ProgressView({
  data,
  progress,
  completedCount,
}: {
  data: Bootstrap;
  progress: number;
  completedCount: number;
}) {
  const evidence = data.today.filter((item) => item.submission).length;
  const averageScore = data.today.length
    ? Math.round(
        data.today.reduce(
          (sum, item) => sum + (item.submission?.ruleScore ?? 0),
          0,
        ) / Math.max(1, evidence),
      )
    : 0;

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">EVIDENCE, NOT CHECKBOXES</span>
        <h1>学习进度</h1>
        <p>这里记录你完成了什么，以及系统为什么相信你完成了。</p>
      </section>
      <section className="day-progress-card">
        <div className="big-day">
          <span>当前学习日</span>
          <strong>{String(data.enrollments[0]?.currentDay ?? 1).padStart(2, "0")}</strong>
          <small>/ 60 DAYS</small>
        </div>
        <div className="overall-line">
          <div>
            <span>今日完成</span>
            <strong>{progress}%</strong>
          </div>
          <div className="long-progress">
            <span style={{ width: `${Math.max(progress, 3)}%` }} />
          </div>
        </div>
      </section>
      <section className="stat-grid">
        <article>
          <span>已完成</span>
          <strong>{completedCount}</strong>
          <small>共 {data.today.length} 门</small>
        </article>
        <article>
          <span>学习证据</span>
          <strong>{evidence}</strong>
          <small>今日提交</small>
        </article>
        <article>
          <span>规则均分</span>
          <strong>{averageScore || "—"}</strong>
          <small>满分 100</small>
        </article>
      </section>
      {data.supervision.lagDays > 0 && (
        <section className="lag-warning">
          <span>课程没有跳过</span>
          <p>
            当前比日历计划落后 {data.supervision.lagDays} 天。完成当前课程后，
            系统会在下一个学习日解锁下一课。
          </p>
        </section>
      )}
      <section className="subject-progress">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACTIVE COURSES</span>
            <h2>独立课程进度</h2>
          </div>
        </div>
        {data.enrollments.map((enrollment) => {
          const item = data.today.find(
            (today) => today.enrollment.id === enrollment.id,
          );
          const done = item?.submission?.status === "completed";
          return (
            <div className="subject-line" key={enrollment.id}>
              <span
                className="subject-swatch"
                style={{ background: enrollment.accent }}
              />
              <strong>{enrollment.title}</strong>
              <div className="mini-progress">
                <span style={{ width: done ? "100%" : "0%" }} />
              </div>
              <small>Day {enrollment.currentDay}</small>
            </div>
          );
        })}
      </section>
    </>
  );
}

function ProfileView({
  data,
  notify,
  onPaymentFinished,
}: {
  data: Bootstrap;
  notify: (message: string) => void;
  onPaymentFinished: () => Promise<void>;
}) {
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const initials =
    data.user.displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";
  const qualifiedTowardNext =
    data.referral.qualified % data.referral.rewardTarget;
  const referralProgress = Math.round(
    (qualifiedTowardNext / Math.max(1, data.referral.rewardTarget)) * 100,
  );
  const accessLabel = {
    trial: "21 天免费试用",
    paid: "付费订阅",
    reward: "邀请奖励",
    expired: "已到期",
  }[data.access.state];

  function localShareUrl() {
    if (data.referral.shareUrl) return data.referral.shareUrl;
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("ref", data.referral.code);
    return url.toString();
  }

  async function shareAcademy() {
    try {
      const url = localShareUrl();
      const text =
        "我在 Academy 做 60 天能力训练。不是收藏课程，是每天必须留下学习证据。";
      const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(
        url,
      )}&text=${encodeURIComponent(text)}`;

      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(telegramShare);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Academy", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      notify("邀请链接已复制");
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }
      notify("分享没有成功，请复制邀请码");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(data.referral.code);
      notify("邀请码已复制");
    } catch {
      notify(`邀请码：${data.referral.code}`);
    }
  }

  async function startStarsPayment(planKey: string, enabled: boolean) {
    if (!enabled) {
      notify("这档方案还没有配置 Stars 数量");
      return;
    }
    if (!window.Telegram?.WebApp?.openInvoice) {
      notify("请从 Telegram Mini App 内发起 Stars 支付");
      return;
    }

    setPayingPlan(planKey);
    try {
      const invoice = await academyRequest<{ invoiceUrl: string }>(
        "/api/academy/payments/invoice",
        {
          method: "POST",
          body: JSON.stringify({ planKey }),
        },
      );
      window.Telegram.WebApp.openInvoice(invoice.invoiceUrl, (status) => {
        setPayingPlan(null);
        if (status === "paid" || status === "pending") {
          notify(
            status === "paid" ? "Stars 支付成功，正在更新权限" : "支付正在确认",
          );
          window.setTimeout(() => void onPaymentFinished(), 700);
          return;
        }
        if (status === "failed") notify("Stars 支付失败，请稍后重试");
      });
    } catch (paymentError) {
      setPayingPlan(null);
      notify(
        paymentError instanceof Error
          ? paymentError.message
          : "Stars 发票创建失败",
      );
    }
  }

  return (
    <>
      <section className="page-intro profile-intro">
        <span className="eyebrow">TELEGRAM PROFILE</span>
        <h1>个人中心</h1>
        <p>身份来自 Telegram 认证，不使用前端填写的信息冒充用户。</p>
      </section>

      <section className="identity-card">
        <div className="identity-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="identity-copy">
          <span>{data.user.isPremium ? "TELEGRAM PREMIUM" : "ACADEMY LEARNER"}</span>
          <h2>{data.user.displayName}</h2>
          <p>
            {data.user.telegramUsername
              ? `@${data.user.telegramUsername}`
              : "未设置 Telegram 用户名"}
          </p>
        </div>
      </section>

      <section className="profile-facts" aria-label="Telegram 个人信息">
        <div>
          <span>Telegram ID</span>
          <strong>{data.user.telegramId ?? "Founder 本地模式"}</strong>
        </div>
        <div>
          <span>语言</span>
          <strong>{data.user.languageCode ?? "未提供"}</strong>
        </div>
        <div>
          <span>学习时区</span>
          <strong>{data.user.timezone}</strong>
        </div>
        <div>
          <span>当前课程</span>
          <strong>{data.enrollments.length} / 3 门</strong>
        </div>
      </section>

      <section className={`access-card access-${data.access.state}`}>
        <div className="access-heading">
          <div>
            <span className="eyebrow">ACCESS STATUS</span>
            <h2>{accessLabel}</h2>
          </div>
          <strong>
            {data.access.active ? `${data.access.daysRemaining} 天` : "已锁定"}
          </strong>
        </div>
        <p>
          {data.access.active
            ? `当前使用权限至 ${formatShortDate(data.access.accessEndsAt)}。`
            : "历史课程、笔记和证据仍可查看；新课程和提交已停止。"}
        </p>
        <div className="pricing-grid" aria-label="订阅价格">
          {data.payment.plans.map((plan) => (
            <button
              type="button"
              key={plan.key}
              disabled={payingPlan !== null}
              onClick={() => startStarsPayment(plan.key, plan.enabled)}
            >
              <span>
                {plan.durationDays} 天
                {plan.recurring ? " · 自动续费" : ""}
              </span>
              <strong>{plan.stars ? `⭐ ${plan.stars}` : "Stars 待定"}</strong>
              <small>
                {plan.usdPrice} 目标价
                {payingPlan === plan.key ? " · 正在创建发票" : ""}
              </small>
            </button>
          ))}
        </div>
        <small className="payment-note">
          {data.payment.enabled
            ? "数字课程通过 Telegram Stars 结算。付款成功回调后才会增加权限。"
            : "Telegram Stars 接口已接好；填写 Bot Token、Webhook Secret 和四档 Stars 数量后启用。"}
        </small>
      </section>

      <section className="referral-card">
        <div className="referral-heading">
          <div>
            <span className="eyebrow">LEARN WITH FRIENDS</span>
            <h2>邀请朋友一起训练</h2>
          </div>
          <strong>
            {qualifiedTowardNext}/{data.referral.rewardTarget}
          </strong>
        </div>
        <p>
          每邀请 {data.referral.rewardTarget} 位有效学习用户，获得{" "}
          {data.referral.rewardDays} 天使用时间。只注册不计算。
        </p>
        <div className="referral-progress" aria-label={`有效邀请进度 ${referralProgress}%`}>
          <span style={{ width: `${Math.max(referralProgress, 2)}%` }} />
        </div>
        <div className="invite-stats">
          <div>
            <strong>{data.referral.total}</strong>
            <span>已进入</span>
          </div>
          <div>
            <strong>{data.referral.pending}</strong>
            <span>学习中</span>
          </div>
          <div>
            <strong>{data.referral.qualified}</strong>
            <span>已有效</span>
          </div>
        </div>
        <div className="invite-code-row">
          <div>
            <span>我的邀请码</span>
            <strong>{data.referral.code}</strong>
          </div>
          <button type="button" onClick={copyCode}>
            复制
          </button>
        </div>
        <button className="primary-button share-button" type="button" onClick={shareAcademy}>
          分享 Academy Mini App
        </button>
        <small className="qualification-note">
          有效邀请 = Telegram 认证、完成选课，并在 7 天内产生至少 3 个有效学习日。
          已获得 {data.referral.earnedRewards} 次 30 天奖励；距离下一次还差{" "}
          {data.referral.nextRewardRemaining} 人。
        </small>
      </section>

      <section className="privacy-note">
        <span>隐私说明</span>
        <p>
          Academy 记录 Telegram ID、姓名、用户名、语言与 Premium 状态，用于身份识别、
          个人中心和邀请防刷。头像地址仅记录，不下载为公开素材。
        </p>
      </section>
    </>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "active" : ""}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value.endsWith("Z") ? value : `${value}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function supervisionCopy(supervision: Bootstrap["supervision"]) {
  if (supervision.state === "completed") {
    return {
      label: "今日完成",
      message: "今天的任务已经留下证据。系统明天再来打扰你。",
    };
  }
  if (supervision.state === "interrupted") {
    return {
      label: "连续中断",
      message: `已经落后 ${supervision.lagDays} 天。下一课不会解锁，先把当前任务处理掉。`,
    };
  }
  if (supervision.state === "behind") {
    return {
      label: "需要补课",
      message: "昨天的任务还在。它没有消失，只是开始积灰。",
    };
  }
  return {
    label: "今日监督",
    message: "不要求突然自律，只要求今天的任务别被明天继承。",
  };
}
