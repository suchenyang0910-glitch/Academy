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

type AbilityAssessment = {
  id: number;
  courseId: string;
  stageKey: "day0" | "day7" | "day21";
  version: string;
  prompt: string;
  rubricJson: string;
  originalAnswer: string;
  revisedAnswer: string | null;
  score: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type DueAssessment = {
  courseId: string;
  stageKey: "day0" | "day7" | "day21";
  label: string;
  targetDay: number;
  title: string;
  prompt: string;
  rubric: string[];
  completed: boolean;
};

type AssessmentSubmissionResponse = {
  assessment: AbilityAssessment;
  bootstrap: Bootstrap;
};

type ReviewResolveResponse = {
  item: Bootstrap["reviewQueue"][number];
  bootstrap: Bootstrap;
};

type LessonItemResponse = {
  item: TodayItem;
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
  reminderPreferences: {
    enabled: boolean;
    reminderHour: number;
    dndStartHour: number | null;
    dndEndHour: number | null;
  };
  referral: {
    code: string;
    total: number;
    pending: number;
    review: number;
    qualified: number;
    rejected: number;
    rewardTarget: number;
    rewardDays: number;
    earnedRewards: number;
    nextRewardRemaining: number;
    shareUrl: string | null;
    items: Array<{
      id: number;
      invitedUserId: string;
      displayName: string;
      telegramUsername: string | null;
      status: string;
      statusReason: string | null;
      riskLevel: string;
      riskSignals: string[];
      qualifiedAt: string | null;
      rewardGrantedAt: string | null;
      createdAt: string;
    }>;
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
  credits: {
    balancePoints: number;
    availablePoints: number;
    pendingPoints: number;
    anchor: { pointsPerUsd: number; rule: string };
  };
  pricing: {
    pointsPerUsd: number;
    maxCreditsRedeemablePercent: number;
  };
  campaign: {
    mainOffer:
      | null
      | {
          type: "campaign";
          id: string;
          name: string;
          rewardMode: string;
          stackableWithCredits: boolean;
          validUntil: string;
        };
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
  abilityAssessments: AbilityAssessment[];
  dueAssessments: DueAssessment[];
  reviewQueue: Array<{
    id: number;
    sourceType: string;
    sourceRef: string;
    courseId: string | null;
    lessonId: string | null;
    assessmentStageKey: string | null;
    reason: string;
    title: string;
    recommendation: string;
    dueOn: string;
    status: string;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  assessmentRecommendations: Array<{
    courseId: string;
    courseTitle: string;
    stageKey: "day0" | "day7" | "day21";
    label: string;
    title: string;
    priority: "due" | "revise";
    status: "pending" | "needs_revision";
    message: string;
    actionLabel: string;
  }>;
  metrics: {
    effectiveLearningDays: number;
    currentEffectiveStreak: number;
    latestEffectiveDay: string | null;
    completedEvidenceCount: number;
    completionBreakdown: {
      self: number;
      prompted: number;
      supervised: number;
    };
    reminderMetrics: {
      deliveredCount: number;
      clickedCount: number;
      completedCount: number;
      averageCompletionMinutes: number | null;
      byLevel: {
        l1: number;
        l2: number;
        l3: number;
        l4: number;
      };
    };
  };
  supervision: {
    todayKey: string;
    timezone: string;
    allCompleted: boolean;
    lagDays: number;
    state: "completed" | "interrupted" | "behind" | "on_track";
  };
};

type PricingPreviewSnapshot = {
  id: string;
  status: string;
  planKey: string;
  currency: string;
  originalAmountMinor: number;
  mainOfferType: string;
  mainOfferId: string | null;
  mainDiscountAmountMinor: number;
  creditsRedeemedPoints: number;
  creditsRedeemedAmountMinor: number;
  finalPayableAmountMinor: number;
  maxCreditsRedeemablePoints: number;
  pricingRuleVersion: string;
  anchorRateVersion: string;
  createdAt: string;
};

type PricingPreviewResponse = { snapshot: PricingPreviewSnapshot };

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
  const [selectedAssessment, setSelectedAssessment] = useState<DueAssessment | null>(null);
  const [selectedReview, setSelectedReview] = useState<Bootstrap["reviewQueue"][number] | null>(null);
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

  useEffect(() => {
    const reminderEventId = new URLSearchParams(window.location.search).get(
      "reminder_event",
    );
    if (!reminderEventId) return;

    void academyRequest<{ ok: boolean }>("/api/academy/reminders/open", {
      method: "POST",
      body: JSON.stringify({ reminderEventId: Number(reminderEventId) }),
    }).catch(() => undefined);
  }, []);

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

  const openReviewItems = data.reviewQueue.filter((item) => item.status === "open");
  const incompleteTodayLesson = data.today.find(
    (item) => item.submission?.status !== "completed",
  );
  const primaryMission =
    data.assessmentRecommendations.length > 0
      ? {
          eyebrow: "TODAY'S MISSION",
          title: "先处理阶段检查",
          detail: data.assessmentRecommendations[0]?.message ?? "先完成当前阶段测评。",
          evidence: "完成一份阶段测评并留下可回看结果。",
        }
      : openReviewItems.length > 0
        ? {
            eyebrow: "TODAY'S MISSION",
            title: "先清理复习队列",
            detail:
              openReviewItems[0]?.recommendation ??
              "先补掉上一轮没吃透的知识点。",
            evidence: "完成 1 条复习项并修正一次旧错误。",
          }
        : incompleteTodayLesson
          ? {
              eyebrow: "TODAY'S MISSION",
              title: `先完成 ${incompleteTodayLesson.enrollment.title}`,
              detail:
                incompleteTodayLesson.lesson?.objective ??
                "今天先交付一份最小可验证输出。",
              evidence: "留下今天的提交记录，并通过本课检查。",
            }
          : {
              eyebrow: "TODAY'S MISSION",
              title: "今天主线已完成",
              detail: "如果你还想继续，可以进入预习区，但它不会替代明天主线。",
              evidence: "额外学习会被记录为证据，但不会覆盖今日完成记录。",
            };

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
          {loading && <LoadingState copy={copy} />}
          {!loading && error && <ErrorState copy={copy} message={error} onRetry={load} />}
          {!loading && data && (
            <>
              {!data.access.active && tab !== "profile" && (
                <ExpiredBanner onOpenPlans={() => setTab("profile")} />
              )}
              {tab === "today" && (
                <TodayView
                  data={data}
                  copy={copy}
                  locale={locale}
                  progress={progress}
                  completedCount={completedCount}
                  onSelect={(item) =>
                    data.access.active ? setSelected(item) : setTab("profile")
                  }
                  onOpenPicker={openCoursePicker}
                  onOpenAssessment={(assessment) => setSelectedAssessment(assessment)}
                  onOpenReview={(item) => setSelectedReview(item)}
                />
              )}
              {tab === "courses" && (
                <CoursesView
                  copy={copy}
                  catalog={data.catalog}
                  enrollments={data.enrollments}
                  today={data.today}
                  learningAhead={data.learningAhead}
                  supervision={data.supervision}
                  onSelect={(item) =>
                    data.access.active ? setSelected(item) : setTab("profile")
                  }
                  onEdit={openCoursePicker}
                />
              )}
              {tab === "notes" && (
                <NotesView
                  copy={copy}
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
                  copy={copy}
                  data={data}
                  progress={progress}
                  completedCount={completedCount}
                  onOpenAssessment={(assessment) => setSelectedAssessment(assessment)}
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
            copy={copy}
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

        {selectedAssessment && data && (
          <AssessmentSheet
            assessment={selectedAssessment}
            existing={data.abilityAssessments.find(
              (item) =>
                item.courseId === selectedAssessment.courseId &&
                item.stageKey === selectedAssessment.stageKey,
            ) ?? null}
            courseTitle={
              data.catalog.find((item) => item.id === selectedAssessment.courseId)?.title ??
              selectedAssessment.courseId
            }
            onClose={() => setSelectedAssessment(null)}
            onSubmitted={(next, submitted) => {
              setData(next);
              setSelectedAssessment(null);
              notify(
                submitted.status === "completed"
                  ? `${selectedAssessment.label} 已记录`
                  : `${selectedAssessment.label} 已保存，可继续修正`,
              );
            }}
          />
        )}

        {selectedReview && data && (
          <ReviewQueueSheet
            item={selectedReview}
            relatedAssessment={
              selectedReview.sourceType === "assessment"
                ? data.dueAssessments.find(
                    (assessment) =>
                      `${assessment.courseId}:${assessment.stageKey}` ===
                      selectedReview.sourceRef,
                  ) ?? null
                : null
            }
            relatedLesson={
              selectedReview.lessonId
                ? [...data.today, ...data.learningAhead].find(
                    (entry) => entry.lesson?.id === selectedReview.lessonId,
                  ) ?? null
                : null
            }
            onClose={() => setSelectedReview(null)}
            onOpenAssessment={(assessment) => {
              setSelectedReview(null);
              setSelectedAssessment(assessment);
            }}
            onOpenLesson={(item) => {
              setSelectedReview(null);
              setSelected(item);
            }}
            onOpenHistoricalLesson={async (lessonId) => {
              const result = await academyRequest<LessonItemResponse>(
                `/api/academy/lessons?lessonId=${encodeURIComponent(lessonId)}`,
              );
              setSelectedReview(null);
              setSelected(result.item);
            }}
            onResolved={(next) => {
              setData(next);
              setSelectedReview(null);
              notify("这条复习项已处理");
            }}
          />
        )}

        {toast && <div className="toast">{toast}</div>}
      </section>
    </main>
  );
}

function LoadingState({ copy }: { copy: ReturnType<typeof copyFor> }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-mark">A</span>
      <strong>{copy.ui.loadingTitle}</strong>
      <p>{copy.ui.loadingDescription}</p>
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
  copy,
  message,
  onRetry,
}: {
  copy: ReturnType<typeof copyFor>;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="error-state">
      <span>{copy.ui.errorLabel}</span>
      <h1>{copy.ui.errorTitle}</h1>
      <p>{message}</p>
      <button className="primary-button" type="button" onClick={onRetry}>
        {copy.ui.retry}
      </button>
    </div>
  );
}

function TodayView({
  data,
  copy,
  locale,
  progress,
  completedCount,
  onSelect,
  onOpenPicker,
  onOpenAssessment,
  onOpenReview,
}: {
  data: Bootstrap;
  copy: ReturnType<typeof copyFor>;
  locale: AppLocale;
  progress: number;
  completedCount: number;
  onSelect: (item: TodayItem) => void;
  onOpenPicker: () => void;
  onOpenAssessment: (assessment: DueAssessment) => void;
  onOpenReview: (item: Bootstrap["reviewQueue"][number]) => void;
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
  const completedTodayCount = completedCourseIds.size;
  const studyAheadMessage =
    data.supervision.lagDays >= 2
      ? "你已经连续中断。预习区先关闭，等当前任务补上后再解锁。"
      : data.supervision.lagDays === 1
        ? "昨天的主线还没补完，预习区先锁住。先把当前任务处理掉。"
        : completedTodayCount === 0
          ? "任意完成一门今天的主线后，才会解锁那门课接下来的 3 节预习。"
          : "已完成的课程可以继续向前；额外学习会留下证据，但不会替代明天的主线。";

  return (
    <>
      <section className="hero">
        <p className="greeting">{copy.hello(data.user.displayName)}</p>
        <h1>{copy.todayLearning}</h1>
        <p className="date-line">
          {new Intl.DateTimeFormat(dateLocaleFor(locale), {
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

      <section className="mission-card" aria-label="Today's mission">
        <span className="eyebrow">{primaryMission.eyebrow}</span>
        <h2>{primaryMission.title}</h2>
        <p>{primaryMission.detail}</p>
        <div className="mission-evidence">
          <strong>完成证据</strong>
          <span>{primaryMission.evidence}</span>
        </div>
      </section>

      {data.assessmentRecommendations.length > 0 && (
        <section className="lesson-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CHECKPOINT FIRST</span>
              <h2>先处理阶段测试</h2>
            </div>
          </div>
          <div className="lesson-list">
            {data.assessmentRecommendations.map((item) => {
              const target = data.dueAssessments.find(
                (assessment) =>
                  assessment.courseId === item.courseId &&
                  assessment.stageKey === item.stageKey,
              );
              if (!target) return null;
              return (
                <article
                  className={`lesson-row ${item.status === "needs_revision" ? "is-done" : ""}`}
                  key={`${item.courseId}:${item.stageKey}:today`}
                  style={{ "--lesson-accent": "#8f786e" } as React.CSSProperties}
                >
                  <button
                    className="lesson-main"
                    type="button"
                    onClick={() => onOpenAssessment(target)}
                  >
                    <span className="lesson-number">
                      {item.stageKey.toUpperCase()}
                    </span>
                    <span className="lesson-copy">
                      <strong>{item.courseTitle}</strong>
                      <span>{item.message}</span>
                    </span>
                    <span className="lesson-arrow" aria-hidden="true">
                      ›
                    </span>
                  </button>
                  <span className={`evidence-state ${item.status === "needs_revision" ? "done" : ""}`}>
                    {item.status === "needs_revision" ? "!" : "·"}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {data.reviewQueue.filter((item) => item.status === "open").length > 0 && (
        <section className="lesson-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">REVIEW QUEUE</span>
              <h2>待复习内容</h2>
            </div>
          </div>
          <div className="lesson-list">
            {data.reviewQueue
              .filter((item) => item.status === "open")
              .slice(0, 4)
              .map((item, index) => (
                <article
                  className="lesson-row"
                  key={`review-${item.id}`}
                  style={{ "--lesson-accent": "#a48250" } as React.CSSProperties}
                >
                  <button
                    className="lesson-main"
                    type="button"
                    onClick={() => onOpenReview(item)}
                  >
                    <span className="lesson-number">
                      R{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="lesson-copy">
                      <strong>{item.title}</strong>
                      <span>{item.recommendation}</span>
                    </span>
                    <span className="lesson-arrow" aria-hidden="true">
                      ›
                    </span>
                  </button>
                  <span className="evidence-state">↺</span>
                </article>
              ))}
          </div>
        </section>
      )}

      <section className="lesson-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TODAY&apos;S WORK</span>
            <h2>{data.today.length ? copy.ui.mustLeaveOutput : copy.ui.selectCourse}</h2>
          </div>
          <button className="text-button" type="button" onClick={onOpenPicker}>
            {copy.ui.adjustCourses}
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
              {studyAheadMessage}
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
            {studyAheadMessage}
          </p>
        )}
      </section>

      <blockquote>
        “完成不是点一下按钮，而是留下一个以后还能检查的结果。”
      </blockquote>
    </>
  );
}

function dateLocaleFor(locale: AppLocale) {
  return {
    "zh-Hans": "zh-CN",
    vi: "vi-VN",
    km: "km-KH",
    th: "th-TH",
  }[locale];
}

function CoursePicker({
  copy,
  catalog,
  initialIds,
  required,
  onClose,
  onSaved,
}: {
  copy: ReturnType<typeof copyFor>;
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
          <h1>{copy.ui.coursePickerTitle}</h1>
          <p>{copy.ui.coursePickerDescription}</p>
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
  copy,
  catalog,
  enrollments,
  today,
  learningAhead,
  supervision,
  onSelect,
  onEdit,
}: {
  copy: ReturnType<typeof copyFor>;
  catalog: CatalogCourse[];
  enrollments: Enrollment[];
  today: TodayItem[];
  learningAhead: TodayItem[];
  supervision: Bootstrap["supervision"];
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
  const nextUnlockMessage =
    supervision.lagDays >= 2
      ? "已经连续中断，预习区先关闭。先把当前必修课补上。"
      : supervision.lagDays === 1
        ? "你已经落后 1 天。下一课暂不解锁，先完成当前主线。"
        : mainDone
          ? "当前主线已完成，下面 3 节可以继续学习，但只记为额外证据。"
          : "完成当前主线后才会解锁后续 3 节，不抢占明天的必修。";

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
        lagDays={supervision.lagDays}
        nextUnlockMessage={nextUnlockMessage}
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
        <p>{copy.ui.courseCatalogDescription}</p>
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
        {copy.ui.changeMyCourses}
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
  lagDays,
  nextUnlockMessage,
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
  lagDays: number;
  nextUnlockMessage: string;
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
          <p>{nextUnlockMessage}</p>
          <div>
            {nextLessons.map((item) => (
              <button
                key={item.lesson?.id}
                type="button"
                disabled={!mainDone || lagDays > 0}
                onClick={() => onSelect(item)}
              >
                <span>DAY {String(item.lesson?.day ?? 0).padStart(2, "0")}</span>
                <strong>{item.lesson?.title}</strong>
                <i>{item.submission?.status === "completed" ? "已完成" : lagDays > 0 ? "先补当前" : mainDone ? "开始 →" : "待解锁"}</i>
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
  const canSubmit = item.enrollment.active === 1;
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
          <RichLessonText text={lesson.content} />
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
          ) : !canSubmit ? (
            <p className="practice-locked">
              杩欐槸涓€鑺傚巻鍙茶绋嬶紝鐜板湪鍙互鍥炵湅鍜屽涔狅紝浣嗕笉鍐嶆帴鍙楁彁浜ゃ€傚鏋滆缁х画鐣欎笅鏂拌瘉鎹紝璇峰洖鍒板綋鍓嶅惎鐢ㄧ殑璇剧▼銆?
            </p>
          ) : (
            <>
          <RichLessonText text={lesson.practicePrompt} compact />
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
                !canSubmit ||
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
  copy,
  notes,
  accessActive,
  onSaved,
}: {
  copy: ReturnType<typeof copyFor>;
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
        <h1>{copy.ui.notesTitle}</h1>
        <p>{copy.ui.notesDescription}</p>
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
              {saving ? copy.saving : copy.ui.saveNote}
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
  copy,
  data,
  progress,
  completedCount,
  onOpenAssessment,
}: {
  copy: ReturnType<typeof copyFor>;
  data: Bootstrap;
  progress: number;
  completedCount: number;
  onOpenAssessment: (assessment: DueAssessment) => void;
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
        <h1>{copy.ui.progressTitle}</h1>
        <p>{copy.ui.progressDescription}</p>
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
        <article>
          <span>有效学习日</span>
          <strong>{data.metrics.effectiveLearningDays}</strong>
          <small>
            当前连续 {data.metrics.currentEffectiveStreak} 天
          </small>
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
      {data.dueAssessments.length > 0 && (
        <section className="subject-progress">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CHECKPOINTS</span>
              <h2>阶段测试</h2>
            </div>
          </div>
          {data.dueAssessments.map((item) => (
            <button
              type="button"
              className="subject-line subject-line-button"
              key={`${item.courseId}:${item.stageKey}`}
              onClick={() => onOpenAssessment(item)}
            >
              <span className="subject-swatch" style={{ background: "#8f786e" }} />
              <strong>{item.title}</strong>
              <div className="mini-progress">
                <span style={{ width: item.completed ? "100%" : "0%" }} />
              </div>
              <small>{item.completed ? "查看 / 重提" : `${item.label} 待完成`}</small>
            </button>
          ))}
        </section>
      )}
      <AssessmentComparison data={data} />
      <section className="stat-grid">
        <article>
          <span>自主完成</span>
          <strong>{data.metrics.completionBreakdown.self}</strong>
          <small>未被提醒直接完成</small>
        </article>
        <article>
          <span>提醒完成</span>
          <strong>{data.metrics.completionBreakdown.prompted}</strong>
          <small>L1 / L2 后完成</small>
        </article>
        <article>
          <span>强监督完成</span>
          <strong>{data.metrics.completionBreakdown.supervised}</strong>
          <small>L3 / L4 后完成</small>
        </article>
      </section>
      <section className="stat-grid">
        <article>
          <span>提醒送达</span>
          <strong>{data.metrics.reminderMetrics.deliveredCount}</strong>
          <small>已成功发到 Telegram</small>
        </article>
        <article>
          <span>提醒后完成</span>
          <strong>{data.metrics.reminderMetrics.completedCount}</strong>
          <small>
            平均 {data.metrics.reminderMetrics.averageCompletionMinutes ?? "—"} 分钟
          </small>
        </article>
        <article>
          <span>高强度完成</span>
          <strong>
            {data.metrics.reminderMetrics.byLevel.l3 +
              data.metrics.reminderMetrics.byLevel.l4}
          </strong>
          <small>L3 / L4 转化</small>
        </article>
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
  const [reminderEnabled, setReminderEnabled] = useState(
    data.reminderPreferences.enabled,
  );
  const [reminderHour, setReminderHour] = useState(
    data.reminderPreferences.reminderHour,
  );
  const [dndStartHour, setDndStartHour] = useState<number | "">(
    data.reminderPreferences.dndStartHour ?? "",
  );
  const [dndEndHour, setDndEndHour] = useState<number | "">(
    data.reminderPreferences.dndEndHour ?? "",
  );
  const [pricingPreview, setPricingPreview] = useState<PricingPreviewSnapshot | null>(null);
  const [lockingPricing, setLockingPricing] = useState(false);
  const [redeemCredits, setRedeemCredits] = useState(true);
  const [paymentResult, setPaymentResult] = useState<
    "paid" | "pending" | "failed" | "cancelled" | null
  >(null);
  const initials =
    data.user.displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";
  const qualifiedInvites = data.referral.qualified;
  const nextReferralRate =
    qualifiedInvites === 0
      ? 10
      : qualifiedInvites === 1
        ? 15
        : qualifiedInvites === 2
          ? 20
          : 10;
  const referralProgress = Math.round(
    (Math.min(qualifiedInvites, 3) / 3) * 100,
  );
  const accessLabel = {
    trial: copy.accessTrial,
    paid: copy.accessPaid,
    reward: copy.accessReward,
    expired: copy.accessExpired,
  }[data.access.state];

  useEffect(() => {
    setSelectedLocale(locale);
  }, [locale]);

  useEffect(() => {
    setReminderEnabled(data.reminderPreferences.enabled);
    setReminderHour(data.reminderPreferences.reminderHour);
    setDndStartHour(data.reminderPreferences.dndStartHour ?? "");
    setDndEndHour(data.reminderPreferences.dndEndHour ?? "");
  }, [data.reminderPreferences]);

  async function saveLocale() {
    setSavingLocale(true);
    try {
      const next = await academyRequest<Bootstrap>("/api/academy/preferences", {
        method: "POST",
        body: JSON.stringify({
          uiLocale: selectedLocale,
          reminderEnabled,
          reminderHour,
          dndStartHour: dndStartHour === "" ? null : dndStartHour,
          dndEndHour: dndEndHour === "" ? null : dndEndHour,
        }),
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
    setPaymentResult(null);
    try {
      const preview = await academyRequest<PricingPreviewResponse>(
        "/api/academy/pricing/preview",
        {
          method: "POST",
          body: JSON.stringify({ planKey, redeemCredits }),
        },
      );
      setPricingPreview(preview.snapshot);
      return;
    } catch (paymentError) {
      setPayingPlan(null);
      notify(
        paymentError instanceof Error
          ? paymentError.message
          : "结算预览失败",
      );
    }
  }

  function cancelPricingPreview() {
    setPricingPreview(null);
    setPayingPlan(null);
    setPaymentResult(null);
  }

  async function confirmPricingAndPay() {
    if (!pricingPreview) return;
    if (!window.Telegram?.WebApp?.openInvoice) return;

    setLockingPricing(true);
    setPaymentResult(null);
    try {
      await academyRequest<{ snapshot: { id: string; status: string } }>(
        "/api/academy/pricing/lock",
        {
          method: "POST",
          body: JSON.stringify({
            snapshotId: pricingPreview.id,
            idempotencyKey: crypto.randomUUID(),
          }),
        },
      );

      const invoice = await academyRequest<{ invoiceUrl: string }>(
        "/api/academy/payments/invoice",
        {
          method: "POST",
          body: JSON.stringify({ snapshotId: pricingPreview.id }),
        },
      );
      window.Telegram.WebApp.openInvoice(invoice.invoiceUrl, (status) => {
        setPayingPlan(null);
        setPricingPreview(null);
        setPaymentResult(status);
        if (status === "paid" || status === "pending") {
          notify(
            status === "paid" ? "Stars 支付成功，正在更新权限" : "支付正在确认",
          );
          const delays = status === "paid" ? [700, 2000] : [700, 2000, 5000];
          delays.forEach((delay, index) => {
            window.setTimeout(() => {
              void onPaymentFinished();
              if (index === delays.length - 1) {
                setPaymentResult(null);
              }
            }, delay);
          });
          return;
        }
        if (status === "failed") notify("Stars 支付失败，请稍后重试");
        if (status === "cancelled") notify("已取消支付");
      });
    } catch (paymentError) {
      setPayingPlan(null);
      notify(
        paymentError instanceof Error
          ? paymentError.message
          : "Stars 发票创建失败",
      );
    } finally {
      setLockingPricing(false);
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

      <section className="language-card" aria-label="提醒偏好">
        <div>
          <span className="eyebrow">REMINDERS</span>
          <h2>{locale === "vi" ? "Nhắc học" : locale === "km" ? "ការរំលឹក" : locale === "th" ? "การเตือน" : "学习提醒"}</h2>
          <p>
            {locale === "vi"
              ? "Tắt là không nhắc. L1 sẽ gửi sau giờ bạn đặt; khung yên tĩnh sẽ không gửi."
              : locale === "km"
                ? "បិទហើយគឺមិនផ្ញើរ។ L1 នឹងផ្ញើបន្ទាប់ពីម៉ោងដែលអ្នកកំណត់ ហើយម៉ោងស្ងប់នឹងមិនរំខាន។"
                : locale === "th"
                  ? "ปิดแล้วจะไม่เตือน L1 จะส่งหลังเวลาที่คุณตั้งไว้ และจะไม่ส่งในช่วงห้ามรบกวน"
                  : "关闭后不再催促；L1 会在你设定的学习时间后触发，免打扰时段内不会发送。"}
          </p>
        </div>
        <div className="language-actions reminder-settings-grid">
          <label className="setting-stack">
            <span>{locale === "vi" ? "Trạng thái" : locale === "km" ? "ស្ថានភាព" : locale === "th" ? "สถานะ" : "提醒状态"}</span>
            <select
              value={reminderEnabled ? "on" : "off"}
              onChange={(event) => setReminderEnabled(event.target.value === "on")}
            >
              <option value="on">{locale === "vi" ? "Bật" : locale === "km" ? "បើក" : locale === "th" ? "เปิด" : "开启"}</option>
              <option value="off">{locale === "vi" ? "Tắt" : locale === "km" ? "បិទ" : locale === "th" ? "ปิด" : "暂停"}</option>
            </select>
          </label>
          <label className="setting-stack">
            <span>{locale === "vi" ? "Giờ bắt đầu" : locale === "km" ? "ម៉ោងចាប់ផ្តើម" : locale === "th" ? "เวลาเริ่ม" : "学习时间"}</span>
            <select
              value={String(reminderHour)}
              onChange={(event) => setReminderHour(Number(event.target.value))}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option value={hour} key={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label className="setting-stack">
            <span>{locale === "vi" ? "Yên tĩnh từ" : locale === "km" ? "ស្ងប់ចាប់ពី" : locale === "th" ? "ห้ามรบกวนเริ่ม" : "免打扰开始"}</span>
            <select
              value={dndStartHour === "" ? "" : String(dndStartHour)}
              onChange={(event) =>
                setDndStartHour(event.target.value === "" ? "" : Number(event.target.value))
              }
            >
              <option value="">{locale === "vi" ? "Không đặt" : locale === "km" ? "មិនកំណត់" : locale === "th" ? "ไม่ตั้ง" : "不设置"}</option>
              {Array.from({ length: 24 }, (_, hour) => (
                <option value={hour} key={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label className="setting-stack">
            <span>{locale === "vi" ? "Yên tĩnh đến" : locale === "km" ? "ស្ងប់រហូតដល់" : locale === "th" ? "ห้ามรบกวนถึง" : "免打扰结束"}</span>
            <select
              value={dndEndHour === "" ? "" : String(dndEndHour)}
              onChange={(event) =>
                setDndEndHour(event.target.value === "" ? "" : Number(event.target.value))
              }
            >
              <option value="">{locale === "vi" ? "Không đặt" : locale === "km" ? "មិនកំណត់" : locale === "th" ? "ไม่ตั้ง" : "不设置"}</option>
              {Array.from({ length: 24 }, (_, hour) => (
                <option value={hour} key={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void saveLocale()}
            disabled={savingLocale}
          >
            {savingLocale ? copy.saving : locale === "vi" ? "Lưu cài đặt" : locale === "km" ? "រក្សាទុក" : locale === "th" ? "บันทึก" : "保存设置"}
          </button>
        </div>
      </section>

      {locale !== "zh-Hans" && (
        <section className="content-language-notice" role="status">
          <p>{copy.contentNotice}</p>
          <span>{copy.contentNoticeAction}</span>
        </section>
      )}

      <section className="profile-facts" aria-label={copy.creditsTitle}>
        <div>
          <span>{copy.creditsAvailable}</span>
          <strong>{new Intl.NumberFormat("en-US").format(data.credits.availablePoints)}</strong>
        </div>
        <div>
          <span>{copy.creditsPending}</span>
          <strong>{new Intl.NumberFormat("en-US").format(data.credits.pendingPoints)}</strong>
        </div>
        <div>
          <span>{copy.creditsAnchor}</span>
          <strong>{data.pricing.pointsPerUsd} = $1</strong>
        </div>
        <div>
          <span>{copy.creditsMaxRedeem}</span>
          <strong>{data.pricing.maxCreditsRedeemablePercent}%</strong>
        </div>
      </section>

      <small className="payment-note">{copy.creditsRule}</small>

      <section className="content-language-notice" role="status">
        <p>
          {copy.campaignTitle}：{" "}
          {data.campaign.mainOffer ? data.campaign.mainOffer.name : copy.campaignNone}
        </p>
        {data.campaign.mainOffer?.validUntil && (
          <span>{copy.campaignValidUntil(formatShortDate(data.campaign.mainOffer.validUntil))}</span>
        )}
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
              disabled={payingPlan !== null || lockingPricing}
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
        <div className="invite-code-row" aria-label="积分抵扣开关">
          <div>
            <span>{copy.billingUseCredits}</span>
            <strong>
              {redeemCredits ? copy.billingUseCreditsOn : copy.billingUseCreditsOff}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setRedeemCredits((current) => !current)}
            disabled={payingPlan !== null || lockingPricing}
          >
            {copy.billingToggle}
          </button>
        </div>

        {pricingPreview && (
          <section className="content-language-notice" role="status">
            <p>{copy.pricingPreviewTitle}</p>
            <span>{copy.pricingPreviewLine({
              original: pricingPreview.originalAmountMinor,
              mainDiscount: pricingPreview.mainDiscountAmountMinor,
              creditsDiscount: pricingPreview.creditsRedeemedAmountMinor,
              payable: pricingPreview.finalPayableAmountMinor,
            })}</span>
            <div className="invite-code-row">
              <button
                className="secondary-button"
                type="button"
                onClick={cancelPricingPreview}
                disabled={lockingPricing}
              >
                {copy.pricingCancel}
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => void confirmPricingAndPay()}
                disabled={lockingPricing}
              >
                {lockingPricing ? copy.pricingLocking : copy.pricingConfirmPay}
              </button>
            </div>
          </section>
        )}
        <small className="payment-note">
          {data.payment.enabled
            ? "数字课程通过 Telegram Stars 结算。付款成功回调后才会增加权限。"
            : "Telegram Stars 接口已接好；填写 Bot Token、Webhook Secret 和四档 Stars 数量后启用。"}
          {paymentResult === "pending"
            ? ` · ${copy.paymentStatusPending}`
            : paymentResult === "paid"
              ? ` · ${copy.paymentStatusPaid}`
              : paymentResult === "failed"
                ? ` · ${copy.paymentStatusFailed}`
                : paymentResult === "cancelled"
                  ? ` · ${copy.paymentStatusCancelled}`
                  : ""}
        </small>
      </section>

      <section className="referral-card">
        <div className="referral-heading">
          <div>
            <span className="eyebrow">LEARN WITH FRIENDS</span>
            <h2>{copy.referralTitle}</h2>
          </div>
          <strong>
            {qualifiedInvites} 位
          </strong>
        </div>
        <p>{copy.referralRule}</p>
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
            <strong>{data.referral.review}</strong>
            <span>待审核</span>
          </div>
          <div>
            <strong>{data.referral.qualified}</strong>
            <span>已有效</span>
          </div>
          <div>
            <strong>{data.referral.rejected}</strong>
            <span>已驳回</span>
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
          {copy.referralQualifiedDefinition} {copy.referralNextRate(nextReferralRate)}
        </small>
        {data.referral.items.length > 0 && (
          <div className="referral-list">
            {data.referral.items.map((item) => (
              <article className="referral-item" key={item.id}>
                <div>
                  <strong>{item.displayName}</strong>
                  <span>
                    {item.telegramUsername ? `@${item.telegramUsername}` : item.invitedUserId}
                  </span>
                </div>
                <div>
                  <strong>
                    {item.status === "qualified"
                      ? "已有效"
                      : item.status === "rejected"
                        ? "已驳回"
                      : item.status === "review"
                        ? "待审核"
                        : "学习中"}
                  </strong>
                  <span>
                    {item.rewardGrantedAt
                      ? `奖励已发放 · ${formatShortDate(item.rewardGrantedAt)}`
                      : item.qualifiedAt
                        ? `已达标 · ${formatShortDate(item.qualifiedAt)}`
                        : `加入时间 · ${formatShortDate(item.createdAt)}`}
                  </span>
                </div>
                {item.riskSignals.length > 0 && (
                  <small className="qualification-note">
                    风险信号：{item.riskSignals.join("、")}
                  </small>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <FeedbackPanel copy={copy} notify={notify} />

    </>
  );
}

function AssessmentComparison({ data }: { data: Bootstrap }) {
  const comparisons = data.catalog
    .map((course) => {
      const day0 = data.abilityAssessments.find(
        (item) => item.courseId === course.id && item.stageKey === "day0",
      );
      const day21 = data.abilityAssessments.find(
        (item) => item.courseId === course.id && item.stageKey === "day21",
      );
      if (!day0 && !day21) return null;
      return {
        courseTitle: course.title,
        day0Score: day0?.score ?? null,
        day21Score: day21?.score ?? null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (comparisons.length === 0) return null;

  return (
    <section className="subject-progress">
      <div className="section-heading">
        <div>
          <span className="eyebrow">BASELINE VS CHECKPOINT</span>
          <h2>Day 0 / Day 21 对比</h2>
        </div>
      </div>
      {comparisons.map((item) => {
        const delta =
          item.day0Score != null && item.day21Score != null
            ? Math.round(item.day21Score - item.day0Score)
            : null;
        return (
          <div className="subject-line" key={item.courseTitle}>
            <span className="subject-swatch" style={{ background: "#57705b" }} />
            <strong>{item.courseTitle}</strong>
            <div className="mini-progress">
              <span
                style={{
                  width: `${Math.max(
                    item.day21Score ?? item.day0Score ?? 0,
                    3,
                  )}%`,
                }}
              />
            </div>
            <small>
              Day 0 {item.day0Score ?? "—"} → Day 21 {item.day21Score ?? "—"}
              {delta != null ? ` · ${delta >= 0 ? "+" : ""}${delta}` : ""}
            </small>
          </div>
        );
      })}
    </section>
  );
}

function AssessmentSheet({
  assessment,
  existing,
  courseTitle,
  onClose,
  onSubmitted,
}: {
  assessment: DueAssessment;
  existing: AbilityAssessment | null;
  courseTitle: string;
  onClose: () => void;
  onSubmitted: (bootstrap: Bootstrap, assessment: AbilityAssessment) => void;
}) {
  const [answer, setAnswer] = useState(
    existing?.revisedAnswer ?? existing?.originalAnswer ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const result = await academyRequest<AssessmentSubmissionResponse>(
        "/api/academy/assessments",
        {
          method: "POST",
          body: JSON.stringify({
            courseId: assessment.courseId,
            stageKey: assessment.stageKey,
            answer,
          }),
        },
      );
      onSubmitted(result.bootstrap, result.assessment);
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
          ‹ 返回进度
        </button>
        <span>
          {assessment.label} · {courseTitle}
        </span>
      </header>
      <div className="lesson-page-content">
        <p className="lesson-kicker">
          {courseTitle.toUpperCase()} · CHECKPOINT
        </p>
        <h1>{assessment.title}</h1>

        <section className="objective-block">
          <span>为什么现在做</span>
          <p>
            这是 {assessment.label}。它会记录你在当前阶段是否真的掌握了关键能力，
            用来和后续阶段做对比。
          </p>
        </section>

        <section className="lesson-reading">
          <span className="eyebrow">01 · PROMPT</span>
          <h2>阶段任务</h2>
          <p>{assessment.prompt}</p>
        </section>

        <section className="practice-card">
          <span className="eyebrow">02 · RUBRIC</span>
          <h2>本次会看什么</h2>
          <div className="criteria-row">
            {assessment.rubric.map((criterion) => (
              <span key={criterion}>{criterion}</span>
            ))}
          </div>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="写下你当前阶段的真实答案。系统会保留原始版本，用于后续对比。"
            maxLength={5000}
          />
          <div className="lesson-submit-bar">
            <div className="answer-meta">
              <span>{answer.trim().length} 字</span>
              {error && <strong>{error}</strong>}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => void submit()}
              disabled={submitting || answer.trim().length < 30}
            >
              {submitting ? "正在记录…" : existing ? "修正后重新提交" : "提交阶段测试"}
            </button>
          </div>
        </section>

        {existing && (
          <section className={`feedback-card ${existing.status === "completed" ? "passed" : ""}`}>
            <div className="score-row">
              <span>当前阶段分数</span>
              <strong>{Math.round(existing.score)}</strong>
            </div>
            <p>{existing.notes ?? "已记录。"}</p>
          </section>
        )}
      </div>
    </div>
  );
}

function ReviewQueueSheet({
  item,
  relatedAssessment,
  relatedLesson,
  onClose,
  onOpenAssessment,
  onOpenLesson,
  onOpenHistoricalLesson,
  onResolved,
}: {
  item: Bootstrap["reviewQueue"][number];
  relatedAssessment: DueAssessment | null;
  relatedLesson: TodayItem | null;
  onClose: () => void;
  onOpenAssessment: (assessment: DueAssessment) => void;
  onOpenLesson: (item: TodayItem) => void;
  onOpenHistoricalLesson: (lessonId: string) => Promise<void> | void;
  onResolved: (bootstrap: Bootstrap) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function resolve() {
    setSaving(true);
    setError("");
    try {
      const result = await academyRequest<ReviewResolveResponse>(
        "/api/academy/review-queue/resolve",
        {
          method: "POST",
          body: JSON.stringify({ reviewQueueItemId: item.id }),
        },
      );
      onResolved(result.bootstrap);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "处理失败",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="lesson-page">
      <header className="lesson-page-header">
        <button type="button" onClick={onClose}>
          ‹ 返回今日
        </button>
        <span>REVIEW · {item.reason === "weekly_review" ? "7 天复习" : "补救任务"}</span>
      </header>
      <div className="lesson-page-content">
        <p className="lesson-kicker">REVIEW QUEUE · {item.sourceType.toUpperCase()}</p>
        <h1>{item.title}</h1>

        <section className="objective-block">
          <span>为什么会回到这里</span>
          <p>{item.recommendation}</p>
        </section>

        <section className="lesson-reading">
          <span className="eyebrow">01 · NEXT ACTION</span>
          <h2>推荐下一步</h2>
          <p>
            {item.sourceType === "assessment"
              ? "先根据阶段测试提示补齐关键维度，再重新提交 checkpoint。"
              : "先回看这节内容，再补一轮输出或确认你仍然记得关键点。"}
          </p>
        </section>

        <section className="practice-card">
          <span className="eyebrow">02 · DO SOMETHING REAL</span>
          <h2>处理这条复习项</h2>
          <div className="invite-code-row">
            {relatedAssessment && (
              <button
                className="primary-button"
                type="button"
                onClick={() => onOpenAssessment(relatedAssessment)}
              >
                去做对应阶段测试
              </button>
            )}
            {relatedLesson && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => onOpenLesson(relatedLesson)}
              >
                打开对应课程
              </button>
            )}
            {!relatedLesson && item.lessonId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => void onOpenHistoricalLesson(item.lessonId)}
              >
                鎵撳紑鍘嗗彶璇剧▼
              </button>
            )}
          </div>
          <div className="lesson-submit-bar">
            <div className="answer-meta">
              <span>完成复习后可手动关闭这条提醒</span>
              {error && <strong>{error}</strong>}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => void resolve()}
              disabled={saving}
            >
              {saving ? "正在关闭…" : "标记本次复习已完成"}
            </button>
          </div>
        </section>
      </div>
    </div>
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

function RichLessonText({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={compact ? "rich-lesson-text compact" : "rich-lesson-text"}>
      {blocks.map((block, index) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const ordered = lines.every((line) => /^\d+\./.test(line));
        const unordered = lines.every((line) => /^[-•]/.test(line));

        if (ordered) {
          return (
            <ol key={`${index}-${block.slice(0, 12)}`} className="lesson-list-block ordered">
              {lines.map((line, lineIndex) => (
                <li key={`${index}-${lineIndex}`}>{line.replace(/^\d+\.\s*/, "")}</li>
              ))}
            </ol>
          );
        }

        if (unordered) {
          return (
            <ul key={`${index}-${block.slice(0, 12)}`} className="lesson-list-block unordered">
              {lines.map((line, lineIndex) => (
                <li key={`${index}-${lineIndex}`}>{line.replace(/^[-•]\s*/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${index}-${block.slice(0, 12)}`} className="lesson-paragraph-block">
            {block}
          </p>
        );
      })}
    </div>
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
