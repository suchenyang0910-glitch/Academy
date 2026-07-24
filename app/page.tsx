"use client";

import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
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
  user: { id: string; displayName: string };
  catalog: CatalogCourse[];
  enrollments: Enrollment[];
  today: TodayItem[];
  notes: Note[];
};

type Tab = "today" | "courses" | "notes" | "progress";

function academyHeaders() {
  return {
    "content-type": "application/json",
    "x-telegram-init-data": window.Telegram?.WebApp?.initData ?? "",
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
      if (bootstrap.enrollments.length === 0) setPickerOpen(true);
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
              {tab === "today" && (
                <TodayView
                  data={data}
                  progress={progress}
                  completedCount={completedCount}
                  onSelect={setSelected}
                  onOpenPicker={() => setPickerOpen(true)}
                />
              )}
              {tab === "courses" && (
                <CoursesView
                  catalog={data.catalog}
                  enrollments={data.enrollments}
                  onEdit={() => setPickerOpen(true)}
                />
              )}
              {tab === "notes" && (
                <NotesView
                  notes={data.notes}
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
            </>
          )}
        </div>

        <nav className="bottom-nav bottom-nav-four" aria-label="主要导航">
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

      <section className="supervision-note">
        <span>今日监督</span>
        <p>不要求突然自律，只要求今天的任务别被明天继承。</p>
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
  onSaved,
}: {
  notes: Note[];
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
