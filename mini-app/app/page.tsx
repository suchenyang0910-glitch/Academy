"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  LOCALE_LABELS,
  copyFor,
  resolveAppLocale,
  type AppLocale,
} from "../lib/i18n";

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
  assessment?: {
    type: "multiple_choice";
    questions: Array<{
      question: string;
      options: Array<{ id: string; label: string }>;
      correctOptionId: string;
      explanation: string;
    }>;
  };
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
  isExtra?: boolean;
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
    uiLocale: AppLocale;
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
  ai: {
    enabled: boolean;
    primary: "deepseek" | "ollama" | "rules_only";
    model: string | null;
    fallbackEnabled: boolean;
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
  learningAhead: TodayItem[];
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
    if (response.status === 401) {
      throw new Error("请从 Telegram 内的 Academy 菜单打开，浏览器链接无法完成身份校验。");
    }
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
  const [locale, setLocale] = useState<AppLocale>("zh-Hans");
  const copy = copyFor(locale);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const bootstrap = await academyRequest<Bootstrap>("/api/academy/bootstrap");
      setData(bootstrap);
      setLocale(resolveAppLocale(bootstrap.user.uiLocale ?? bootstrap.user.languageCode));
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

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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
          <Image
            className="brand-mark"
            src="/brand/academy-bot-logo.png"
            alt="Academy"
            width={36}
            height={36}
            priority
            unoptimized
          />
          <div className="brand-copy">
            <strong>ACADEMY</strong>
            <span>{copy.brandSubtitle}</span>
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
                  copy={copy}
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
                  today={data.today}
                  learningAhead={data.learningAhead}
                  onSelect={(item) =>
                    data.access.active ? setSelected(item) : setTab("profile")
                  }
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
                  locale={locale}
                  copy={copy}
                  notify={notify}
                  onPaymentFinished={load}
                  onLocaleSaved={(next) => {
                    setData(next);
                    setLocale(resolveAppLocale(next.user.uiLocale));
                    notify(copyFor(resolveAppLocale(next.user.uiLocale)).saved);
                  }}
                />
              )}
            </>
          )}
        </div>

        <nav className="bottom-nav bottom-nav-five" aria-label="Academy navigation">
          <NavButton
            active={tab === "today"}
            icon="⌂"
            label={copy.today}
            onClick={() => setTab("today")}
          />
          <NavButton
            active={tab === "courses"}
            icon="≡"
            label={copy.courses}
            onClick={() => setTab("courses")}
          />
          <NavButton
            active={tab === "notes"}
            icon="▤"
            label={copy.notes}
            onClick={() => setTab("notes")}
          />
          <NavButton
            active={tab === "progress"}
            icon="▥"
            label={copy.progress}
            onClick={() => setTab("progress")}
          />
          <NavButton
            active={tab === "profile"}
            icon="○"
            label={copy.profile}
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
                      learningAhead: current.learningAhead.map((item) =>
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
                selected.isExtra && submission.status === "completed"
                  ? "预习证据已保存；明天仍要完成主线"
                  : submission.status === "completed"
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
  copy,
  progress,
  completedCount,
  onSelect,
  onOpenPicker,
}: {
  data: Bootstrap;
  copy: ReturnType<typeof copyFor>;
  progress: number;
  completedCount: number;
  onSelect: (item: TodayItem) => void;
  onOpenPicker: () => void;
}) {
  const minutes = data.enrollments.reduce(
    (sum, item) => sum + item.dailyMinutes,
    0,
  );
  const completedCourseIds = new Set(
    data.today
      .filter(
        (item) =>
          item.submission?.status === "completed" &&
          item.submission.completionSource !== "extra",
      )
      .map((item) => item.enrollment.courseId),
  );
  const learningAhead = data.learningAhead.filter((item) =>
    completedCourseIds.has(item.enrollment.courseId),
  );

  return (
    <>
      <section className="hero">
        <p className="greeting">{copy.hello(data.user.displayName)}</p>
        <h1>{copy.todayLearning}</h1>
        <p className="date-line">
          {new Intl.DateTimeFormat("zh-CN", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }).format(new Date())}
          {" · "}
          {copy.minutes(minutes)}
        </p>
        <div className="progress-summary">
          <div className="progress-copy">
            <span>{copy.todayComplete}</span>
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

      <section className={`continue-study ${learningAhead.length ? "is-open" : ""}`}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">KEEP GOING</span>
            <h2>想多学一点？</h2>
          </div>
          <span className="continue-study-time">每门再加 15–20 分钟</span>
        </div>
        {learningAhead.length ? (
          <>
            <p className="continue-study-copy">
              已完成的课程可以继续向前。下面是该课程接下来的 3 节预习；完成它们会保存为额外学习证据，但不会挤掉未来每天的主线。
            </p>
            <div className="continue-study-list">
              {learningAhead.map((item) => (
                <button
                  className={`continue-study-row ${
                    item.submission?.status === "completed" ? "is-done" : ""
                  }`}
                  key={`${item.enrollment.id}-${item.lesson?.id}`}
                  type="button"
                  onClick={() => item.lesson && onSelect(item)}
                  disabled={!item.lesson}
                >
                  <span>{item.enrollment.title}</span>
                  <strong>DAY {String(item.lesson?.day ?? 0).padStart(2, "0")}</strong>
                  <em>{item.lesson?.title}</em>
                  <i>{item.submission?.status === "completed" ? "已完成" : "预习 →"}</i>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="continue-study-copy">
            任意完成一门今天的主线练习，就会开放那门课接下来的 3 节。先留下学习证据，再继续向前，不让“多学”变成只浏览不输出。
          </p>
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
  today,
  learningAhead,
  onSelect,
  onEdit,
}: {
  catalog: CatalogCourse[];
  enrollments: Enrollment[];
  today: TodayItem[];
  learningAhead: TodayItem[];
  onSelect: (item: TodayItem) => void;
  onEdit: () => void;
}) {
  const [focusedCourseId, setFocusedCourseId] = useState<string | null>(null);
  const activeIds = new Set(enrollments.map((item) => item.courseId));
  const focusedEnrollment = enrollments.find(
    (item) => item.courseId === focusedCourseId,
  );
  const focusedCourse = catalog.find((item) => item.id === focusedCourseId);
  const currentLesson = today.find(
    (item) => item.enrollment.courseId === focusedCourseId,
  );
  const mainDone =
    currentLesson?.submission?.status === "completed" &&
    currentLesson.submission.completionSource !== "extra";
  const nextLessons = learningAhead.filter(
    (item) => item.enrollment.courseId === focusedCourseId,
  );

  if (focusedCourse && focusedEnrollment && currentLesson) {
    const continuation = continuationFor(focusedCourse.id);
    const hasGraduated =
      focusedEnrollment.currentDay >= focusedCourse.durationDays && mainDone;
    return (
      <CoursePathView
        course={focusedCourse}
        enrollment={focusedEnrollment}
        currentLesson={currentLesson}
        nextLessons={nextLessons}
        mainDone={Boolean(mainDone)}
        graduated={hasGraduated}
        continuation={continuation}
        onBack={() => setFocusedCourseId(null)}
        onSelect={onSelect}
      />
    );
  }

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
            <button
              type="button"
              className="catalog-card"
              key={course.id}
              onClick={() => active && setFocusedCourseId(course.id)}
              disabled={!active}
              style={{ "--course-accent": course.accent } as React.CSSProperties}
            >
              <span>{course.subtitle}</span>
              <h2>{course.title}</h2>
              <p>{course.summary}</p>
              <div>
                <strong>{course.durationDays} DAYS</strong>
                <small>{course.dailyMinutes} 分钟／天</small>
                <em>{active ? "查看路径 →" : "未选择"}</em>
              </div>
            </button>
          );
        })}
      </div>
      <button className="new-note-button" type="button" onClick={onEdit}>
        调整我的课程
      </button>
    </>
  );
}

function continuationFor(courseId: string) {
  const paths: Record<string, { title: string; description: string }> = {
    english: {
      title: "English Level 2 · 真实场景沟通",
      description: "从固定表达进入追问、协作与 10 分钟以上的连续真实交流。",
    },
    "ai-command-skills": {
      title: "AI Level 2 · 工作流与可运行原型",
      description: "从单个指令进入多工具工作流、评估集与可运行的个人原型。",
    },
    business: {
      title: "Business Extension · 市场验证与成交",
      description: "把机会判断延展到连续访谈、报价测试和可复核的购买意向。",
    },
    "founder-note": {
      title: "Founder Note Level 2 · 决策系统",
      description: "从每日记录进入决策复盘、反例库与个人判断 SOP。",
    },
    quiz: {
      title: "Quiz Level 2 · 情景挑战",
      description: "从知识提取进入跨场景判断、限时作答与错误模式训练。",
    },
  };
  return paths[courseId];
}

function CoursePathView({
  course,
  enrollment,
  currentLesson,
  nextLessons,
  mainDone,
  graduated,
  continuation,
  onBack,
  onSelect,
}: {
  course: CatalogCourse;
  enrollment: Enrollment;
  currentLesson: TodayItem;
  nextLessons: TodayItem[];
  mainDone: boolean;
  graduated: boolean;
  continuation?: { title: string; description: string };
  onBack: () => void;
  onSelect: (item: TodayItem) => void;
}) {
  return (
    <section className="course-path" style={{ "--course-accent": course.accent } as React.CSSProperties}>
      <button className="path-back" type="button" onClick={onBack}>
        ‹ 返回课程
      </button>
      <span className="eyebrow">{course.subtitle.toUpperCase()}</span>
      <h1>{course.title}</h1>
      <p>{course.summary}</p>

      <div className="path-progress">
        <span>60 天主线</span>
        <strong>DAY {String(enrollment.currentDay).padStart(2, "0")}</strong>
        <i style={{ "--path-progress": `${Math.min(100, (enrollment.currentDay / course.durationDays) * 100)}%` } as React.CSSProperties} />
      </div>

      <section className="path-current">
        <span className="eyebrow">CURRENT REQUIRED</span>
        <strong>{currentLesson.lesson?.title}</strong>
        <p>{currentLesson.lesson?.objective}</p>
        <button className="primary-button" type="button" onClick={() => onSelect(currentLesson)}>
          {mainDone ? "查看今天的学习证据" : "继续今天的主线 →"}
        </button>
      </section>

      {!graduated && (
        <section className={`path-next ${mainDone ? "is-open" : ""}`}>
          <span className="eyebrow">OPTIONAL NEXT</span>
          <h2>继续加学</h2>
          <p>{mainDone ? "主线完成后，这 3 节可立即继续学习。" : "完成当前主线后解锁，不抢占明天的必修。"}</p>
          <div>
            {nextLessons.map((item) => (
              <button
                key={item.lesson?.id}
                type="button"
                disabled={!mainDone}
                onClick={() => onSelect(item)}
              >
                <span>DAY {String(item.lesson?.day ?? 0).padStart(2, "0")}</span>
                <strong>{item.lesson?.title}</strong>
                <i>{item.submission?.status === "completed" ? "已完成" : mainDone ? "开始 →" : "待解锁"}</i>
              </button>
            ))}
          </div>
        </section>
      )}

      {continuation && (
        <section className={`continuation-card ${graduated ? "is-ready" : ""}`}>
          <span className="eyebrow">AFTER DAY 60</span>
          <h2>{continuation.title}</h2>
          <p>{continuation.description}</p>
          <strong>{graduated ? "已满足解锁条件 · 即将进入下一阶段" : "完成 Day 60 能力验证后解锁"}</strong>
        </section>
      )}
    </section>
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState(item.submission);
  const [knowledgeRead, setKnowledgeRead] = useState(Boolean(item.submission));
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
            answer: lesson.assessment ? JSON.stringify(selectedOptions) : answer,
            completionSource: item.isExtra ? "extra" : "self",
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
          {item.isExtra ? "EXTRA · " : ""}DAY {String(lesson.day).padStart(2, "0")} · {lesson.estimatedMinutes} MIN
        </span>
      </header>
      <div className="lesson-page-content">
        <p className="lesson-kicker">
          {item.enrollment.title.toUpperCase()} · ROUND {lesson.round}
          {item.isExtra ? " · EXTRA STUDY" : ""}
        </p>
        <h1>{lesson.title}</h1>

        <section className="objective-block">
          <span>今天的目标</span>
          <p>{lesson.objective}</p>
        </section>

        <section className="lesson-reading">
          <span className="eyebrow">01 · LEARN FIRST</span>
          <h2>先学，再做</h2>
          <p>{lesson.content}</p>
          {!knowledgeRead && (
            <button
              className="secondary-button learn-complete-button"
              type="button"
              onClick={() => setKnowledgeRead(true)}
            >
              我已看完，开始练习 →
            </button>
          )}
        </section>

        <section className="practice-card">
          <span className="eyebrow">02 · ACTIVE PRACTICE</span>
          <h2>{lesson.assessment ? "完成本课检查" : "必须留下输出"}</h2>
          {!knowledgeRead ? (
            <p className="practice-locked">
              先完成上方的学习卡。看完句型和示例后，再开始写你的答案。
            </p>
          ) : (
            <>
          <p>{lesson.practicePrompt}</p>
          {lesson.assessment ? (
            <div className="multiple-choice">
              {lesson.assessment.questions.map((question, questionIndex) => (
                <div className="choice-question" key={question.question} role="radiogroup" aria-label={question.question}>
                  <strong>{questionIndex + 1}. {question.question}</strong>
                  {question.options.map((option) => {
                    const selected = selectedOptions[String(questionIndex)] === option.id;
                    return (
                      <button
                        key={option.id}
                        className={selected ? "choice-option selected" : "choice-option"}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setSelectedOptions((current) => ({
                            ...current,
                            [questionIndex]: option.id,
                          }))
                        }
                      >
                        <span>{option.id.toUpperCase()}</span>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <>
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
            </>
          )}
          <div className="lesson-submit-bar">
            <div className="answer-meta">
              <span>
                {lesson.assessment
                  ? `已完成 ${Object.keys(selectedOptions).length}/${lesson.assessment.questions.length} 题`
                  : `${answer.trim().length} 字`}
              </span>
              {error && <strong>{error}</strong>}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={submit}
              disabled={
                submitting ||
                (lesson.assessment
                  ? Object.keys(selectedOptions).length !== lesson.assessment.questions.length
                  : !answer.trim())
              }
            >
              {submitting ? "正在检查…" : submission ? "修正后重新提交" : "提交学习证据"}
            </button>
          </div>
            </>
          )}
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
              <span>AI 教练点评</span>
              <p>
                {submission.aiFeedback ||
                  "AI 教练暂时没有回应。规则评分已保存，不影响今天的学习。"}
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
  locale,
  copy,
  notify,
  onPaymentFinished,
  onLocaleSaved,
}: {
  data: Bootstrap;
  locale: AppLocale;
  copy: ReturnType<typeof copyFor>;
  notify: (message: string) => void;
  onPaymentFinished: () => Promise<void>;
  onLocaleSaved: (data: Bootstrap) => void;
}) {
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(locale);
  const [savingLocale, setSavingLocale] = useState(false);
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

  async function saveLocale() {
    setSavingLocale(true);
    try {
      const next = await academyRequest<Bootstrap>("/api/academy/preferences", {
        method: "POST",
        body: JSON.stringify({ uiLocale: selectedLocale }),
      });
      onLocaleSaved(next);
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to save language");
    } finally {
      setSavingLocale(false);
    }
  }

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
          <span>{copy.telegramLanguage}</span>
          <strong>{data.user.languageCode ?? "未提供"}</strong>
        </div>
        <div>
          <span>{copy.timezone}</span>
          <strong>{data.user.timezone}</strong>
        </div>
        <div>
          <span>{copy.activeCourses}</span>
          <strong>{data.enrollments.length} / 3 门</strong>
        </div>
      </section>

      <section className="language-card" aria-label={copy.interfaceLanguage}>
        <div>
          <span className="eyebrow">LANGUAGE</span>
          <h2>{copy.interfaceLanguage}</h2>
          <p>{copy.languageHelp}</p>
        </div>
        <div className="language-actions">
          <select
            value={selectedLocale}
            onChange={(event) => setSelectedLocale(resolveAppLocale(event.target.value))}
            aria-label={copy.interfaceLanguage}
          >
            {Object.entries(LOCALE_LABELS).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void saveLocale()}
            disabled={savingLocale || selectedLocale === locale}
          >
            {savingLocale ? copy.saving : copy.saveLanguage}
          </button>
        </div>
      </section>

      {locale !== "zh-Hans" && (
        <section className="content-language-notice" role="status">
          <p>{copy.contentNotice}</p>
          <span>{copy.contentNoticeAction}</span>
        </section>
      )}

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

      <FeedbackPanel copy={copy} notify={notify} />

    </>
  );
}

function FeedbackPanel({
  copy,
  notify,
}: {
  copy: ReturnType<typeof copyFor>;
  notify: (message: string) => void;
}) {
  const [category, setCategory] = useState<"bug" | "content" | "idea" | "other">("bug");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitFeedback() {
    setSaving(true);
    try {
      await academyRequest("/api/academy/feedback", {
        method: "POST",
        body: JSON.stringify({
          category,
          content,
          pageContext: "profile",
          appVersion: "mini-app",
        }),
      });
      setContent("");
      notify(copy.feedbackSent);
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to send feedback");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="feedback-card">
      <div>
        <span className="eyebrow">FEEDBACK</span>
        <h2>{copy.feedbackTitle}</h2>
        <p>{copy.feedbackDescription}</p>
      </div>
      <div className="feedback-categories" role="group" aria-label={copy.feedbackTitle}>
        {(["bug", "content", "idea", "other"] as const).map((value) => (
          <button
            className={category === value ? "selected" : ""}
            type="button"
            key={value}
            onClick={() => setCategory(value)}
            aria-pressed={category === value}
          >
            {copy.feedbackCategory(value)}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={copy.feedbackPlaceholder}
        maxLength={2000}
      />
      <button
        className="secondary-button"
        type="button"
        onClick={() => void submitFeedback()}
        disabled={saving || content.trim().length < 5}
      >
        {saving ? copy.saving : copy.sendFeedback}
      </button>
    </section>
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
