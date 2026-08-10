"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  LOCALE_LABELS,
  contentLocaleLabel,
  copyFor,
  resolveAppLocale,
  type AppLocale,
} from "../lib/i18n";
import {
  assessmentRuntimeCopy,
  courseDomainRuntimeCopy,
  courseRuntimeCopy,
  creditsLedgerStatusCopy,
  creditsLedgerTypeCopy,
  goalRuntimeCopy,
  learningModeRuntimeCopy,
  lessonRuntimeCopy,
  notesRuntimeCopy,
  profileRuntimeCopy,
  progressRuntimeCopy,
  reminderDiagnosticCopy,
  reminderHistoryEmpty,
  reminderHistoryStatus,
  reminderHistorySummary,
  reminderHistoryTitle,
  requestRuntimeCopy,
  starsStatusCopy,
  supervisionRuntimeCopy,
  testReminderCopy,
  todayRuntimeCopy,
  reviewRuntimeCopy,
} from "../lib/runtime-copy";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            language_code?: string;
          };
        };
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
  contentLocale: AppLocale;
  isContentFallback: boolean;
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
  contentLocale: AppLocale;
  isContentFallback: boolean;
};

type Submission = {
  lessonId: string;
  status: string;
  ruleScore: number;
  ruleFeedback?: string;
  aiFeedback?: string | null;
  completionSource?: string;
  evidenceStatus?: string | null;
};

type PaymentResultState = "paid" | "pending" | "failed" | "cancelled";

type TodayItem = {
  enrollment: Enrollment;
  lesson: Lesson | null;
  submission: Submission | null;
  isExtra?: boolean;
};

function hasAcceptedLessonEvidence(item: TodayItem) {
  return (
    item.submission?.status === "completed" &&
    item.submission.evidenceStatus === "accepted"
  );
}

function hasAcceptedMainlineEvidence(item: TodayItem) {
  return (
    hasAcceptedLessonEvidence(item) &&
    item.submission?.completionSource !== "extra"
  );
}

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
  reminderDiagnostic: {
    enabled: boolean;
    telegramBound: boolean;
    timezone: string;
    nextReminderLocal: string | null;
    reason:
      | "scheduled"
      | "eligible_now"
      | "paused"
      | "missing_telegram_id"
      | "access_expired"
      | "no_active_courses"
      | "completed_today"
      | "do_not_disturb";
    lastEvent: null | {
      level: number;
      deliveryStatus: string;
      sentAt: string;
      deliveredAt: string | null;
    };
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
    continuation: {
      primaryPlanKey: string;
      primaryUsdPrice: string;
      primaryStars: number | null;
      primaryPlanEnabled: boolean;
      primaryDisabledReason: string | null;
      qualifiedInvites: number;
      qualifiedInvitesNeeded: number;
      referralRewardTarget: number;
      creditsAvailablePoints: number;
      estimatedCreditsUsd: number;
      maxRedeemablePercent: number;
      canReduceNextPaymentWithCredits: boolean;
      requiredAction: "none" | "pay_or_redeem_credits" | "configure_stars";
    };
  };
  credits: {
    balancePoints: number;
    availablePoints: number;
    pendingPoints: number;
    anchor: { pointsPerUsd: number; rule: string };
    ledger: Array<{
      id: number;
      entryType: string;
      rewardType: string;
      amountPoints: number;
      status: string;
      relatedOrderId: string | null;
      relatedInvitationId: number | null;
      relatedCampaignRewardId: string | null;
      expiresAt: string | null;
      createdAt: string;
    }>;
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
      configuredBy: string | null;
      enabled: boolean;
      disabledReason:
        | "missing_bot_token"
        | "missing_webhook_secret"
        | "missing_stars_amount"
        | null;
    }>;
  };
  catalog: CatalogCourse[];
  enrollments: Enrollment[];
  today: TodayItem[];
  learningAhead: TodayItem[];
  notes: Note[];
  reminderHistory: Array<{
    id: number;
    level: number;
    deliveryStatus: string;
    sentAt: string;
    deliveredAt: string | null;
    clickedAt: string | null;
    completedAt: string | null;
  }>;
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
  goalTemplate: null | {
    id: string;
    version: string;
    title: string;
    slogan: string;
    artifact: string;
    definitionOfDone: string[];
    checkpoints: Array<{
      id: string;
      day: number;
      label: string;
      title: string;
      outcome: string;
      evidence: string[];
      definitionOfDone: string[];
    }>;
    nextCheckpoint: null | {
      id: string;
      day: number;
      label: string;
      title: string;
      outcome: string;
      evidence: string[];
      definitionOfDone: string[];
    };
    milestoneSubmissions: Array<{
      id: number;
      templateId: string;
      checkpointId: string;
      checkpointDay: number;
      artifactUrl: string | null;
      evidenceText: string;
      evidenceItems: string[];
      status: string;
      score: number;
      notes: string | null;
      submittedAt: string;
      updatedAt: string;
    }>;
    currentDay: number;
    completedLessons: number;
    totalDays: number;
    prototypeProgress: number;
    nextMilestone: string;
    nextEvidence: string;
  };
  agentLab: null | {
    id: number;
    templateId: string;
    builderProvider: "flowise";
    builderProjectRef: string | null;
    workflowRef: string | null;
    workflowExport: Record<string, unknown>;
    status: string;
    runtimeStatus: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    runtimeChecks: Array<{
      id: number;
      checkType: string;
      testCases: Array<{
        question: string;
        expected: string;
        actual: string;
        citation: string;
      }>;
      result: Record<string, unknown>;
      status: string;
      score: number;
      notes: string | null;
      createdAt: string;
    }>;
  };
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
    evidenceMetrics: {
      acceptedCount: number;
      lessonAcceptedCount: number;
      averageScore: number | null;
      byType: {
        quiz: number;
        project: number;
        reflection: number;
        checkpoint: number;
        review: number;
        runtimeSuccess: number;
      };
    };
    quizMetrics: {
      attemptCount: number;
      lessonAttemptedCount: number;
      firstAttemptCount: number;
      firstPassCount: number;
      firstPassRate: number;
      firstFailCount: number;
      revisionAttemptLessonCount: number;
      revisionPassAfterFailCount: number;
      revisionPassAfterFailRate: number;
      questionAccuracyRate: number;
    };
    goalMetrics: {
      templateId: string;
      requiredCheckpointCount: number;
      completedCheckpointCount: number;
      evidenceSubmissionRate: number;
      fwpr7: {
        eligible: boolean;
        achieved: boolean;
      };
      day21Dod: {
        achieved: boolean;
      };
    };
    competencyGraph: {
      overallScore: number;
      evidencedNodeCount: number;
      totalNodeCount: number;
      nodes: Array<{
        id: string;
        title: string;
        description: string;
        level: number;
        category: string;
        weight: number;
        evidenceCount: number;
        score: number;
        status: "not_started" | "in_progress" | "evidenced";
      }>;
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

type AcademyRequestErrorCode = "telegram_auth_required" | "request_failed";

class AcademyRequestError extends Error {
  code: AcademyRequestErrorCode;

  constructor(code: AcademyRequestErrorCode) {
    super(code);
    this.name = "AcademyRequestError";
    this.code = code;
  }
}

function initialClientLocale() {
  if (typeof window === "undefined") return "zh-Hans";
  return resolveAppLocale(
    window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code ??
      window.navigator.language,
  );
}

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

function academyUploadHeaders() {
  const referralCode =
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("ref") ?? "";
  return {
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
      throw new AcademyRequestError("telegram_auth_required");
    }
    await response.json().catch(() => null);
    throw new AcademyRequestError("request_failed");
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
  const [locale, setLocale] = useState<AppLocale>(() => initialClientLocale());
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
      const requestCopy = requestRuntimeCopy(locale);
      setError(
        requestError instanceof AcademyRequestError
          ? requestError.code === "telegram_auth_required"
            ? requestCopy.telegramAuthRequired
            : requestCopy.requestFailed
          : requestCopy.loadFailed,
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

  function trackConversionEvent(eventType: string, planKey?: string) {
    void academyRequest<{ event: unknown }>("/api/academy/conversion-events", {
      method: "POST",
      body: JSON.stringify({
        eventType,
        planKey,
        metadata: { tab, locale },
      }),
    }).catch(() => undefined);
  }

  useEffect(() => {
    if (!data || data.access.active) return;
    const key = `academy:conversion:trial_expired_exposed:${data.user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackConversionEvent("trial_expired_exposed");
  }, [data, locale, tab]);

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
      notify(copy.accessExpiredAction);
      return;
    }
    setPickerOpen(true);
  }

  const completedCount =
    data?.today.filter((item) => hasAcceptedMainlineEvidence(item)).length ?? 0;
  const totalCount = data?.today.length ?? 0;
  const progress =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const openReviewItems = (data?.reviewQueue ?? []).filter((item) => item.status === "open");
  const incompleteTodayLesson = data?.today.find(
    (item) => !hasAcceptedMainlineEvidence(item),
  );
  const todayCopy = todayRuntimeCopy(locale);
  const primaryMission =
    (data?.assessmentRecommendations ?? []).length > 0
      ? {
          eyebrow: "TODAY'S MISSION",
          title: todayCopy.missionAssessmentTitle,
          detail:
            data?.assessmentRecommendations[0]?.message ??
            todayCopy.missionAssessmentDetail,
          evidence: todayCopy.missionAssessmentEvidence,
        }
      : openReviewItems.length > 0
        ? {
            eyebrow: "TODAY'S MISSION",
            title: todayCopy.missionReviewTitle,
            detail:
              openReviewItems[0]?.recommendation ??
              todayCopy.missionReviewDetail,
            evidence: todayCopy.missionReviewEvidence,
          }
        : incompleteTodayLesson
          ? {
              eyebrow: "TODAY'S MISSION",
              title: todayCopy.missionLessonTitle(
                incompleteTodayLesson.enrollment.title,
              ),
              detail:
                incompleteTodayLesson.lesson?.objective ??
                todayCopy.missionLessonDetail,
              evidence: todayCopy.missionLessonEvidence,
            }
          : {
              eyebrow: "TODAY'S MISSION",
              title: todayCopy.missionDoneTitle,
              detail: todayCopy.missionDoneDetail,
              evidence: todayCopy.missionDoneEvidence,
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
                <ExpiredBanner
                  continuation={data.access.continuation}
                  copy={profileRuntimeCopy(locale)}
                  onOpenPlans={() => {
                    trackConversionEvent("plans_opened");
                    setTab("profile");
                  }}
                />
              )}
              {tab === "today" && (
                <TodayView
                  data={data}
                  copy={copy}
                  locale={locale}
                  progress={progress}
                  completedCount={completedCount}
                  onMilestoneSaved={(next) => {
                    setData(next);
                    notify(goalRuntimeCopy(locale).milestoneSaved);
                  }}
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
                  locale={locale}
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
                  locale={locale}
                  notes={data.notes}
                  accessActive={data.access.active}
                  onSaved={(note) => {
                    setData((current) =>
                      current
                        ? { ...current, notes: [note, ...current.notes] }
                        : current,
                    );
                    notify(notesRuntimeCopy(locale).savedToast);
                  }}
                />
              )}
              {tab === "progress" && (
                <ProgressView
                  copy={copy}
                  locale={locale}
                  data={data}
                  progress={progress}
                  completedCount={completedCount}
                  onOpenAssessment={(assessment) => setSelectedAssessment(assessment)}
                  notify={notify}
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
            locale={locale}
            catalog={data.catalog}
            initialIds={data.enrollments.map((item) => item.courseId)}
            required={data.enrollments.length === 0}
            onClose={() => setPickerOpen(false)}
            onSaved={(next) => {
              setData(next);
              setPickerOpen(false);
              notify(courseRuntimeCopy(locale).coursePlanUpdated);
            }}
          />
        )}

        {selected?.lesson && (
          <LessonSheet
            item={selected}
            locale={locale}
            onClose={() => setSelected(null)}
            onSubmitted={(submission) => {
              const lessonCopy = lessonRuntimeCopy(locale);
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
                  ? lessonCopy.extraEvidenceSaved
                  : submission.status === "completed"
                    ? lessonCopy.lessonEvidenceSaved
                    : lessonCopy.revisionSaved,
              );
            }}
          />
        )}

        {selectedAssessment && data && (
          <AssessmentSheet
            assessment={selectedAssessment}
            locale={locale}
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
              const assessmentCopy = assessmentRuntimeCopy(locale);
              setData(next);
              setSelectedAssessment(null);
              notify(
                submitted.status === "completed"
                  ? assessmentCopy.recorded(selectedAssessment.label)
                  : assessmentCopy.savedForRevision(selectedAssessment.label),
              );
            }}
          />
        )}

        {selectedReview && data && (
          <ReviewQueueSheet
            item={selectedReview}
            locale={locale}
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
              notify(reviewRuntimeCopy(locale).resolvedToast);
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

function ContentFallbackNotice({
  copy,
  locale,
  contentLocale,
  compact = false,
}: {
  copy: ReturnType<typeof copyFor>;
  locale: AppLocale;
  contentLocale: AppLocale;
  compact?: boolean;
}) {
  if (locale === contentLocale) return null;
  return (
    <section className={`content-fallback-badge ${compact ? "compact" : ""}`} role="status">
      <span>{contentLocaleLabel(contentLocale)}</span>
      <p>{copy.contentNotice}</p>
    </section>
  );
}

function paymentStatusContent(
  copy: ReturnType<typeof copyFor>,
  status: PaymentResultState,
) {
  return {
    pending: {
      title: copy.paymentStatusPending,
      detail: copy.paymentStatusPendingDetail,
    },
    paid: {
      title: copy.paymentStatusPaid,
      detail: copy.paymentStatusPaidDetail,
    },
    failed: {
      title: copy.paymentStatusFailed,
      detail: copy.paymentStatusFailedDetail,
    },
    cancelled: {
      title: copy.paymentStatusCancelled,
      detail: copy.paymentStatusCancelledDetail,
    },
  }[status];
}

function ExpiredBanner({
  continuation,
  copy,
  onOpenPlans,
}: {
  continuation: Bootstrap["access"]["continuation"];
  copy: ReturnType<typeof profileRuntimeCopy>;
  onOpenPlans: () => void;
}) {
  return (
    <section className="expired-banner" role="status">
      <div>
        <span>{copy.expiredTitle}</span>
        <p>{copy.expiredDescription(continuation.primaryUsdPrice, continuation.qualifiedInvitesNeeded)}</p>
      </div>
      <button type="button" onClick={onOpenPlans}>
        {copy.viewPlans}
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
  onMilestoneSaved,
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
  onMilestoneSaved: (data: Bootstrap) => void;
}) {
  const minutes = data.enrollments.reduce(
    (sum, item) => sum + item.dailyMinutes,
    0,
  );
  const completedCourseIds = new Set(
    data.today
      .filter((item) => hasAcceptedMainlineEvidence(item))
      .map((item) => item.enrollment.courseId),
  );
  const learningAhead = data.learningAhead.filter((item) =>
    completedCourseIds.has(item.enrollment.courseId),
  );
  const completedTodayCount = completedCourseIds.size;
  const courseCopy = courseRuntimeCopy(locale);
  const modeCopy = learningModeRuntimeCopy(locale);
  const todayCopy = todayRuntimeCopy(locale);
  const openReviewItems = data.reviewQueue.filter((item) => item.status === "open");
  const incompleteTodayLesson = data.today.find(
    (item) => !hasAcceptedMainlineEvidence(item),
  );
  const primaryMission =
    data.assessmentRecommendations.length > 0
      ? {
          eyebrow: "TODAY'S MISSION",
          title: todayCopy.missionAssessmentTitle,
          detail:
            data.assessmentRecommendations[0]?.message ??
            todayCopy.missionAssessmentDetail,
          evidence: todayCopy.missionAssessmentEvidence,
        }
      : openReviewItems.length > 0
        ? {
            eyebrow: "TODAY'S MISSION",
            title: todayCopy.missionReviewTitle,
            detail:
              openReviewItems[0]?.recommendation ??
              todayCopy.missionReviewDetail,
            evidence: todayCopy.missionReviewEvidence,
          }
        : incompleteTodayLesson
          ? {
              eyebrow: "TODAY'S MISSION",
              title: todayCopy.missionLessonTitle,
              detail:
                incompleteTodayLesson.lesson?.objective ??
                todayCopy.missionLessonDetail,
              evidence: todayCopy.missionLessonEvidence,
            }
          : {
              eyebrow: "TODAY'S MISSION",
              title: todayCopy.missionDoneTitle,
              detail: todayCopy.missionDoneDetail,
              evidence: todayCopy.missionDoneEvidence,
            };
  const remainingMainlineCount = data.today.filter(
    (item) => !hasAcceptedMainlineEvidence(item),
  ).length;
  const firstRequiredLesson = data.today.find(
    (item) => item.lesson && !hasAcceptedMainlineEvidence(item),
  );
  const firstActiveLesson =
    learningAhead.find((item) => item.lesson && !hasAcceptedLessonEvidence(item)) ??
    learningAhead.find((item) => item.lesson);
  const studyAheadMessage =
    data.supervision.lagDays >= 2
      ? courseCopy.lockedByInterruption
      : data.supervision.lagDays === 1
        ? courseCopy.lockedByBehind
        : completedTodayCount === 0
          ? courseCopy.extraLocked
          : courseCopy.extraOpen;

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
            aria-label={todayCopy.progressLabel(progress)}
          >
            <div>{progress}%</div>
          </div>
        </div>
      </section>

      <section
        className={`supervision-note supervision-${data.supervision.state}`}
      >
        <span>{supervisionRuntimeCopy(data.supervision, locale).label}</span>
        <p>{supervisionRuntimeCopy(data.supervision, locale).message}</p>
      </section>

      <section className="learning-mode-panel" aria-label="Learning mode">
        <div className="learning-mode-head">
          <span className="eyebrow">ACTIVE / PASSIVE</span>
          <h2>{modeCopy.title}</h2>
          <p>{modeCopy.subtitle}</p>
        </div>
        <div className="learning-mode-grid">
          <article className="learning-mode-card passive">
            <span>{modeCopy.passiveLabel}</span>
            <strong>{modeCopy.passiveTitle}</strong>
            <p>{modeCopy.passiveDetail(remainingMainlineCount)}</p>
            <button
              type="button"
              onClick={() => firstRequiredLesson && onSelect(firstRequiredLesson)}
              disabled={!firstRequiredLesson}
            >
              {firstRequiredLesson ? modeCopy.passiveAction : modeCopy.passiveDone}
            </button>
          </article>
          <article className="learning-mode-card active">
            <span>{modeCopy.activeLabel}</span>
            <strong>{modeCopy.activeTitle}</strong>
            <p>{modeCopy.activeDetail(learningAhead.length)}</p>
            <button
              type="button"
              onClick={() => firstActiveLesson && onSelect(firstActiveLesson)}
              disabled={!firstActiveLesson}
            >
              {firstActiveLesson ? modeCopy.activeAction : modeCopy.activeLocked}
            </button>
          </article>
        </div>
      </section>

      {data.goalTemplate && (
        <GoalTemplateCard
          goal={data.goalTemplate}
          agentLab={data.agentLab}
          locale={locale}
          accessActive={data.access.active}
          onSaved={onMilestoneSaved}
        />
      )}

      <section className="mission-card" aria-label="Today's mission">
        <span className="eyebrow">{primaryMission.eyebrow}</span>
        <h2>{primaryMission.title}</h2>
        <p>{primaryMission.detail}</p>
        <div className="mission-evidence">
          <strong>{todayRuntimeCopy(locale).evidenceLabel}</strong>
          <span>{primaryMission.evidence}</span>
        </div>
      </section>

      {data.assessmentRecommendations.length > 0 && (
        <section className="lesson-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CHECKPOINT FIRST</span>
              <h2>{todayCopy.checkpointFirstTitle}</h2>
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
              <h2>{todayCopy.reviewQueueTitle}</h2>
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
            <strong>{todayCopy.chooseCoursesTitle}</strong>
            <span>{todayCopy.chooseCoursesSubtitle}</span>
          </button>
        ) : (
          <div className="lesson-list">
            {data.today.map((item, index) => {
              const done = hasAcceptedMainlineEvidence(item);
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
                        {item.lesson?.title ?? todayCopy.lessonPreparing}
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
            <h2>{courseCopy.continueExtraTitle}</h2>
          </div>
          <span className="continue-study-time">{courseCopy.continueExtraTime}</span>
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
                    hasAcceptedLessonEvidence(item) ? "is-done" : ""
                  }`}
                  key={`${item.enrollment.id}-${item.lesson?.id}`}
                  type="button"
                  onClick={() => item.lesson && onSelect(item)}
                  disabled={!item.lesson}
                >
                  <span>{item.enrollment.title}</span>
                  <strong>DAY {String(item.lesson?.day ?? 0).padStart(2, "0")}</strong>
                  <em>{item.lesson?.title}</em>
                  <i>
                    {hasAcceptedLessonEvidence(item)
                      ? courseCopy.completed
                      : courseCopy.preview}
                  </i>
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
        {todayCopy.evidenceQuote}
      </blockquote>
    </>
  );
}

function GoalTemplateCard({
  goal,
  agentLab,
  locale,
  accessActive,
  onSaved,
}: {
  goal: NonNullable<Bootstrap["goalTemplate"]>;
  agentLab: Bootstrap["agentLab"];
  locale: AppLocale;
  accessActive: boolean;
  onSaved: (data: Bootstrap) => void;
}) {
  const copy = goalRuntimeCopy(locale);
  const defaultCheckpointId =
    goal.nextCheckpoint?.id ?? goal.checkpoints[0]?.id ?? "";
  const [openCheckpointId, setOpenCheckpointId] = useState(defaultCheckpointId);
  const [artifactUrl, setArtifactUrl] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [uploadedArtifacts, setUploadedArtifacts] = useState<
    Array<{
      id: number;
      reference: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
    }>
  >([]);
  const [runtimeTests, setRuntimeTests] = useState(
    Array.from({ length: 3 }, () => ({
      question: "",
      expected: "",
      actual: "",
      citation: "",
    })),
  );
  const [builderProjectRef, setBuilderProjectRef] = useState(
    agentLab?.builderProjectRef ?? "",
  );
  const [workflowRef, setWorkflowRef] = useState(agentLab?.workflowRef ?? "");
  const [workflowExportText, setWorkflowExportText] = useState(
    agentLab?.workflowExport && Object.keys(agentLab.workflowExport).length > 0
      ? JSON.stringify(agentLab.workflowExport, null, 2)
      : "",
  );
  const [savingAgentLab, setSavingAgentLab] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const selectedCheckpoint =
    goal.checkpoints.find((checkpoint) => checkpoint.id === openCheckpointId) ??
    goal.checkpoints[0] ??
    null;
  const runtimeTestsRequired = Number(selectedCheckpoint?.day ?? 0) >= 7;
  const submissionByCheckpoint = new Map(
    goal.milestoneSubmissions.map((submission) => [
      submission.checkpointId,
      submission,
    ]),
  );

  useEffect(() => {
    setBuilderProjectRef(agentLab?.builderProjectRef ?? "");
    setWorkflowRef(agentLab?.workflowRef ?? "");
    setWorkflowExportText(
      agentLab?.workflowExport && Object.keys(agentLab.workflowExport).length > 0
        ? JSON.stringify(agentLab.workflowExport, null, 2)
        : "",
    );
  }, [agentLab]);

  async function saveAgentLab() {
    setSavingAgentLab(true);
    setError("");
    try {
      let workflowExport: unknown = workflowExportText.trim();
      if (workflowExportText.trim()) {
        try {
          workflowExport = JSON.parse(workflowExportText);
        } catch {
          workflowExport = { raw: workflowExportText.trim() };
        }
      }
      const result = await academyRequest<{ bootstrap: Bootstrap }>(
        "/api/academy/agent-lab",
        {
          method: "POST",
          body: JSON.stringify({
            action: "save_project",
            templateId: goal.id,
            builderProjectRef,
            workflowRef,
            workflowExport,
          }),
        },
      );
      onSaved(result.bootstrap);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : copy.agentLabSaveFailed,
      );
    } finally {
      setSavingAgentLab(false);
    }
  }

  async function recordStructuredRuntimeCheck() {
    if (!agentLab?.id) {
      setError(copy.saveAgentLabFirst);
      return;
    }
    setSavingAgentLab(true);
    setError("");
    try {
      const result = await academyRequest<{ bootstrap: Bootstrap }>(
        "/api/academy/agent-lab",
        {
          method: "POST",
          body: JSON.stringify({
            action: "record_runtime_check",
            agentProjectId: agentLab.id,
            runtimeTests,
            result: {
              source: "agent_lab_structured_check",
              note: "Academy checks test cases, citations, workflow export and reachable runtime/reference link.",
            },
          }),
        },
      );
      onSaved(result.bootstrap);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : copy.runtimeCheckFailed,
      );
    } finally {
      setSavingAgentLab(false);
    }
  }

  async function uploadMilestoneArtifact(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "project_milestone");
      const response = await fetch("/api/academy/uploads", {
        method: "POST",
        headers: academyUploadHeaders(),
        body: formData,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || copy.uploadFailed);
      }
      const result = (await response.json()) as {
        artifact: {
          id: number;
          reference: string;
          originalFilename: string;
          mimeType: string;
          sizeBytes: number;
        };
      };
      setUploadedArtifacts((items) => [...items, result.artifact]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : copy.uploadFailed,
      );
    } finally {
      setUploading(false);
    }
  }

  async function submitMilestone() {
    if (!selectedCheckpoint) return;
    setSaving(true);
    setError("");
    try {
      const result = await academyRequest<{
        milestone: NonNullable<
          Bootstrap["goalTemplate"]
        >["milestoneSubmissions"][number];
        bootstrap: Bootstrap;
      }>("/api/academy/goals/milestones", {
        method: "POST",
        body: JSON.stringify({
          templateId: goal.id,
          checkpointId: selectedCheckpoint.id,
          artifactUrl,
          evidenceText,
          attachmentIds: uploadedArtifacts.map((artifact) => artifact.id),
          runtimeTests: runtimeTestsRequired ? runtimeTests : [],
        }),
      });
      setArtifactUrl("");
      setEvidenceText("");
      setUploadedArtifacts([]);
      setRuntimeTests(
        Array.from({ length: 3 }, () => ({
          question: "",
          expected: "",
          actual: "",
          citation: "",
        })),
      );
      onSaved(result.bootstrap);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : copy.submitFailed,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="goal-template-card" aria-label="Goal template">
      <span className="eyebrow">GOAL TEMPLATE</span>
      <div className="goal-template-head">
        <div>
          <h2>{goal.title}</h2>
          <p>{goal.slogan}</p>
        </div>
        <strong>{goal.prototypeProgress}%</strong>
      </div>
      <div className="goal-progress-line">
        <span style={{ width: `${Math.max(goal.prototypeProgress, 4)}%` }} />
      </div>
      <div className="goal-template-grid">
        <div>
          <span>Artifact</span>
          <strong>{goal.artifact}</strong>
        </div>
        <div>
          <span>Next milestone</span>
          <strong>{goal.nextMilestone}</strong>
        </div>
      </div>
      <div className="mission-evidence">
        <strong>Next evidence</strong>
        <span>{goal.nextEvidence}</span>
      </div>
      <div className="agent-lab-card">
        <div className="agent-lab-head">
          <div>
            <span className="eyebrow">AGENT LAB</span>
            <strong>Flowise Adapter · Reference Only</strong>
          </div>
          <em>{agentLab?.runtimeStatus ?? "not_tested"}</em>
        </div>
        <p>
          {copy.agentLabBody}
        </p>
        <div className="agent-lab-form">
          <input
            value={builderProjectRef}
            onChange={(event) => setBuilderProjectRef(event.target.value)}
            placeholder="Flowise project / chatflow URL"
            disabled={!accessActive || savingAgentLab}
          />
          <input
            value={workflowRef}
            onChange={(event) => setWorkflowRef(event.target.value)}
            placeholder="Workflow export / README / repo reference"
            disabled={!accessActive || savingAgentLab}
          />
          <textarea
            value={workflowExportText}
            onChange={(event) => setWorkflowExportText(event.target.value)}
            placeholder={copy.workflowExportPlaceholder}
            rows={3}
            disabled={!accessActive || savingAgentLab}
          />
          <button
            type="button"
            onClick={() => void saveAgentLab()}
            disabled={!accessActive || savingAgentLab}
          >
            {savingAgentLab ? copy.savingAgentLab : copy.saveAgentLab}
          </button>
          <button
            type="button"
            onClick={() => void recordStructuredRuntimeCheck()}
            disabled={!accessActive || savingAgentLab || !agentLab?.id}
          >
            {copy.recordRuntimeCheck}
          </button>
        </div>
        {agentLab?.runtimeChecks.length ? (
          <div className="agent-runtime-checks">
            {agentLab.runtimeChecks.map((check) => (
              <span key={check.id}>
                {check.status} · {check.score} · {check.testCases.length} tests
              </span>
            ))}
          </div>
        ) : (
          <small>{copy.noRuntimeChecks}</small>
        )}
      </div>
      <div className="goal-checkpoint-list">
        {goal.checkpoints.map((checkpoint) => (
          <button
            type="button"
            className={
              checkpoint.id === openCheckpointId
                ? "goal-checkpoint is-selected"
                : checkpoint.day <= goal.currentDay
                ? "goal-checkpoint is-current"
                : "goal-checkpoint"
            }
            key={checkpoint.id}
            onClick={() => {
              setOpenCheckpointId(checkpoint.id);
              setError("");
              setRuntimeTests(
                Array.from({ length: 3 }, () => ({
                  question: "",
                  expected: "",
                  actual: "",
                  citation: "",
                })),
              );
            }}
          >
            <span>{checkpoint.label}</span>
            <strong>{checkpoint.title}</strong>
            <small>{checkpoint.outcome}</small>
            {submissionByCheckpoint.has(checkpoint.id) && (
              <em>
                {submissionByCheckpoint.get(checkpoint.id)?.status === "accepted"
                  ? "accepted"
                  : submissionByCheckpoint.get(checkpoint.id)?.status === "pending_review"
                    ? "pending review"
                  : "revise"}{" "}
                · {submissionByCheckpoint.get(checkpoint.id)?.score}
              </em>
            )}
          </button>
        ))}
      </div>
      {selectedCheckpoint && (
        <div className="milestone-submit-box">
          <div>
            <span>{selectedCheckpoint.label} Evidence</span>
            <strong>{selectedCheckpoint.title}</strong>
          </div>
          <input
            value={artifactUrl}
            onChange={(event) => setArtifactUrl(event.target.value)}
            placeholder="https:// demo / README / workflow export"
            disabled={!accessActive || saving}
          />
          <textarea
            value={evidenceText}
            onChange={(event) => setEvidenceText(event.target.value)}
            placeholder={copy.evidencePlaceholder}
            rows={4}
            disabled={!accessActive || saving}
          />
          {runtimeTestsRequired && (
            <div className="runtime-test-grid" aria-label="Runtime tests">
              <strong>{copy.runtimeEvidenceTitle}</strong>
              <small>
                {copy.runtimeEvidenceHint}
              </small>
              {runtimeTests.map((testCase, index) => (
                <div className="runtime-test-case" key={index}>
                  <span>TEST {index + 1}</span>
                  <input
                    value={testCase.question}
                    onChange={(event) =>
                      setRuntimeTests((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, question: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder={copy.runtimeQuestionPlaceholder}
                    disabled={!accessActive || saving}
                  />
                  <input
                    value={testCase.expected}
                    onChange={(event) =>
                      setRuntimeTests((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, expected: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder={copy.runtimeExpectedPlaceholder}
                    disabled={!accessActive || saving}
                  />
                  <textarea
                    value={testCase.actual}
                    onChange={(event) =>
                      setRuntimeTests((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, actual: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder={copy.runtimeActualPlaceholder}
                    rows={2}
                    disabled={!accessActive || saving}
                  />
                  <input
                    value={testCase.citation}
                    onChange={(event) =>
                      setRuntimeTests((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, citation: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder={copy.runtimeCitationPlaceholder}
                    disabled={!accessActive || saving}
                  />
                </div>
              ))}
            </div>
          )}
          <label className="artifact-upload-box">
            <span>{uploading ? copy.uploading : copy.uploadArtifact}</span>
            <small>{copy.uploadHint}</small>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/markdown,application/json,.md,.json"
              disabled={!accessActive || saving || uploading}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                void uploadMilestoneArtifact(file);
              }}
            />
          </label>
          {uploadedArtifacts.length > 0 && (
            <div className="uploaded-artifact-list">
              {uploadedArtifacts.map((artifact) => (
                <span key={artifact.id}>
                  {artifact.originalFilename} · {Math.ceil(artifact.sizeBytes / 1024)}KB
                </span>
              ))}
            </div>
          )}
          {error && <small className="form-error">{error}</small>}
          <button
            className="primary-button"
            type="button"
            onClick={() => void submitMilestone()}
            disabled={!accessActive || saving || uploading}
          >
            {saving ? copy.recording : copy.submitMilestone}
          </button>
        </div>
      )}
    </section>
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
  locale,
  catalog,
  initialIds,
  required,
  onClose,
  onSaved,
}: {
  copy: ReturnType<typeof copyFor>;
  locale: AppLocale;
  catalog: CatalogCourse[];
  initialIds: string[];
  required: boolean;
  onClose: () => void;
  onSaved: (data: Bootstrap) => void;
}) {
  const courseCopy = courseRuntimeCopy(locale);
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
        setError(courseCopy.maxThreeCourses);
        return current;
      }
      return [...current, courseId];
    });
  }

  async function save() {
    if (selectedIds.length < 1) {
      setError(courseCopy.minOneCourse);
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
        requestError instanceof Error ? requestError.message : courseCopy.saveFailed,
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
            {courseCopy.cancel}
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
          <span>{courseCopy.selectedCount(selectedIds.length)}</span>
          <strong>{courseCopy.dailyMinutes(minutes)}</strong>
        </div>
        {error && <p>{error}</p>}
        <button
          className="primary-button"
          type="button"
          onClick={save}
          disabled={saving}
        >
          {saving ? courseCopy.savingPlan : courseCopy.startTraining}
        </button>
      </footer>
    </div>
  );
}

function CoursesView({
  copy,
  locale,
  catalog,
  enrollments,
  today,
  learningAhead,
  supervision,
  onSelect,
  onEdit,
}: {
  copy: ReturnType<typeof copyFor>;
  locale: AppLocale;
  catalog: CatalogCourse[];
  enrollments: Enrollment[];
  today: TodayItem[];
  learningAhead: TodayItem[];
  supervision: Bootstrap["supervision"];
  onSelect: (item: TodayItem) => void;
  onEdit: () => void;
}) {
  const courseCopy = courseRuntimeCopy(locale);
  const [focusedCourseId, setFocusedCourseId] = useState<string | null>(null);
  const activeIds = new Set(enrollments.map((item) => item.courseId));
  const focusedEnrollment = enrollments.find(
    (item) => item.courseId === focusedCourseId,
  );
  const focusedCourse = catalog.find((item) => item.id === focusedCourseId);
  const currentLesson = today.find(
    (item) => item.enrollment.courseId === focusedCourseId,
  );
  const mainDone = currentLesson
    ? hasAcceptedMainlineEvidence(currentLesson)
    : false;
  const nextLessons = learningAhead.filter(
    (item) => item.enrollment.courseId === focusedCourseId,
  );
  const nextUnlockMessage =
    supervision.lagDays >= 2
      ? courseCopy.lockedByInterruption
      : supervision.lagDays === 1
        ? courseCopy.lockedByBehind
        : mainDone
          ? courseCopy.extraOpen
          : courseCopy.extraLocked;

  if (focusedCourse && focusedEnrollment && currentLesson) {
    const continuation =
      courseCopy.extensionPaths[
        focusedCourse.id as keyof typeof courseCopy.extensionPaths
      ];
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
        locale={locale}
        onBack={() => setFocusedCourseId(null)}
        onSelect={onSelect}
      />
    );
  }

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">COURSE CATALOG</span>
        <h1>{copy.courses}</h1>
        <p>{copy.ui.courseCatalogDescription}</p>
      </section>
      <div className="catalog-list">
        {catalog.map((course) => {
          const active = activeIds.has(course.id);
          const domain = courseDomainRuntimeCopy(locale, course.id);
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
              <div className="course-domain-tags">
                <span>{domain.domain}</span>
                <span>{domain.evidence}</span>
              </div>
              <small className="course-domain-mode">{domain.mode}</small>
              {course.isContentFallback && (
                <ContentFallbackNotice
                  copy={copy}
                  locale={locale}
                  contentLocale={course.contentLocale}
                  compact
                />
              )}
              <div className="catalog-card-meta">
                <strong>{course.durationDays} DAYS</strong>
                <small>{courseCopy.minutesPerDay(course.dailyMinutes)}</small>
                <em>{active ? courseCopy.viewPath : courseCopy.notSelected}</em>
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
  locale,
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
  locale: AppLocale;
  onBack: () => void;
  onSelect: (item: TodayItem) => void;
}) {
  const copy = courseRuntimeCopy(locale);
  const appCopy = copyFor(locale);
  const domain = courseDomainRuntimeCopy(locale, course.id);
  return (
    <section className="course-path" style={{ "--course-accent": course.accent } as React.CSSProperties}>
      <button className="path-back" type="button" onClick={onBack}>
        {copy.backCourses}
      </button>
      <span className="eyebrow">{course.subtitle.toUpperCase()}</span>
      <h1>{course.title}</h1>
      <p>{course.summary}</p>
      <div className="course-domain-panel">
        <span>{domain.domain}</span>
        <strong>{domain.evidence}</strong>
        <p>{domain.mode}</p>
      </div>
      {course.isContentFallback && (
        <ContentFallbackNotice
          copy={appCopy}
          locale={locale}
          contentLocale={course.contentLocale}
        />
      )}

      <div className="path-progress">
        <span>{copy.mainline60}</span>
        <strong>DAY {String(enrollment.currentDay).padStart(2, "0")}</strong>
        <i style={{ "--path-progress": `${Math.min(100, (enrollment.currentDay / course.durationDays) * 100)}%` } as React.CSSProperties} />
      </div>

      <section className="path-current">
        <span className="eyebrow">CURRENT REQUIRED</span>
        <strong>{currentLesson.lesson?.title}</strong>
        <p>{currentLesson.lesson?.objective}</p>
        <button className="primary-button" type="button" onClick={() => onSelect(currentLesson)}>
          {mainDone ? copy.viewTodayEvidence : copy.continueMainline}
        </button>
      </section>

      {!graduated && (
        <section className={`path-next ${mainDone ? "is-open" : ""}`}>
          <span className="eyebrow">OPTIONAL NEXT</span>
          <h2>{copy.continueExtra}</h2>
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
                <i>
                  {hasAcceptedLessonEvidence(item)
                    ? copy.completed
                    : lagDays > 0
                      ? copy.catchUpFirst
                      : mainDone
                        ? copy.start
                        : copy.locked}
                </i>
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
          <strong>
            {graduated ? copy.nextStageReady : copy.day60Unlock}
          </strong>
        </section>
      )}
    </section>
  );
}

function LessonSheet({
  item,
  locale,
  onClose,
  onSubmitted,
}: {
  item: TodayItem;
  locale: AppLocale;
  onClose: () => void;
  onSubmitted: (submission: Submission) => void;
}) {
  const lesson = item.lesson!;
  const copy = lessonRuntimeCopy(locale);
  const appCopy = copyFor(locale);
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
        requestError instanceof Error ? requestError.message : copy.submitFailed,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lesson-page">
        <header className="lesson-page-header">
          <button type="button" onClick={onClose}>
          {copy.backToday}
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
        {lesson.isContentFallback && (
          <ContentFallbackNotice
            copy={appCopy}
            locale={locale}
            contentLocale={lesson.contentLocale}
          />
        )}

        <section className="lesson-flow" aria-label={copy.flowTitle}>
          <span>{copy.flowLearn}</span>
          <i aria-hidden="true" />
          <span>{copy.flowExample}</span>
          <i aria-hidden="true" />
          <span>{copy.flowCheck}</span>
          <i aria-hidden="true" />
          <span>{copy.flowEvidence}</span>
        </section>

        <section className="objective-block">
          <span>{copy.todayObjective}</span>
          <p>{lesson.objective}</p>
        </section>

        <section className="lesson-reading">
          <span className="eyebrow">01 · LEARN FIRST</span>
          <h2>{copy.learnFirstTitle}</h2>
          <RichLessonText text={lesson.content} />
          {!knowledgeRead && (
            <button
              className="secondary-button learn-complete-button"
              type="button"
              onClick={() => setKnowledgeRead(true)}
            >
              {copy.startPractice}
            </button>
          )}
        </section>

        <section className="practice-card">
          <span className="eyebrow">02 · ACTIVE PRACTICE</span>
          <h2>{lesson.assessment ? copy.lessonCheckTitle : copy.mustLeaveOutput}</h2>
          {!knowledgeRead ? (
            <p className="practice-locked">
              {copy.practiceLocked}
            </p>
          ) : !canSubmit ? (
            <p className="practice-locked">
              {copy.historyReadOnly}
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
                placeholder={copy.answerPlaceholder}
                maxLength={4000}
              />
            </>
          )}
          <section className="evidence-rule-card">
            <span>{copy.evidenceStepTitle}</span>
            <p>{copy.evidenceStepBody}</p>
          </section>
          <div className="lesson-submit-bar">
            <div className="answer-meta">
              <span>
                {lesson.assessment
                  ? copy.choiceProgress(
                      Object.keys(selectedOptions).length,
                      lesson.assessment.questions.length,
                    )
                  : copy.wordCount(answer.trim().length)}
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
              {submitting
                ? copy.checking
                : submission
                  ? copy.resubmit
                  : copy.submitEvidence}
            </button>
          </div>
            </>
          )}
        </section>

        {submission && (
          <section
            className={`feedback-card ${
              submission.evidenceStatus === "accepted" ? "passed" : ""
            }`}
          >
            <div>
              <span>{copy.ruleScore}</span>
              <strong>{Math.round(submission.ruleScore)}</strong>
            </div>
            <p>{submission.ruleFeedback}</p>
            <div className="ai-feedback">
              <span>{copy.aiCoach}</span>
              <p>
                {submission.aiFeedback ||
                  copy.aiFallback}
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
  locale,
  notes,
  accessActive,
  onSaved,
}: {
  copy: ReturnType<typeof copyFor>;
  locale: AppLocale;
  notes: Note[];
  accessActive: boolean;
  onSaved: (note: Note) => void;
}) {
  const noteCopy = notesRuntimeCopy(locale);
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
        requestError instanceof Error ? requestError.message : noteCopy.saveFailed,
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
            placeholder={noteCopy.placeholder}
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
          {noteCopy.lockedComposer}
        </p>
      )}
      <section className="timeline note-timeline">
        {notes.length === 0 && (
          <p className="empty-note">{noteCopy.emptyNote}</p>
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
  locale,
  data,
  progress,
  completedCount,
  onOpenAssessment,
  notify,
}: {
  copy: ReturnType<typeof copyFor>;
  locale: AppLocale;
  data: Bootstrap;
  progress: number;
  completedCount: number;
  onOpenAssessment: (assessment: DueAssessment) => void;
  notify: (message: string) => void;
}) {
  const progressCopy = progressRuntimeCopy(locale);
  const evidence = data.metrics.evidenceMetrics.acceptedCount;
  const averageScore = data.metrics.evidenceMetrics.averageScore;
  const [exportingProof, setExportingProof] = useState<"json" | "markdown" | null>(null);
  const [creatingProofShare, setCreatingProofShare] = useState(false);
  const [proofShareUrl, setProofShareUrl] = useState("");

  async function exportCompetencyProof(format: "json" | "markdown") {
    setExportingProof(format);
    try {
      const response = await fetch(`/api/academy/competency-proof?format=${format}`, {
        headers: academyUploadHeaders(),
      });
      if (!response.ok) {
        throw new Error("export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        format === "markdown"
          ? "academy-competency-proof.md"
          : "academy-competency-proof.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExportingProof(null);
    }
  }

  async function createProofShare() {
    setCreatingProofShare(true);
    try {
      const response = await fetch("/api/academy/competency-proof", {
        method: "POST",
        headers: academyUploadHeaders(),
      });
      if (!response.ok) {
        throw new Error("proof share failed");
      }
      const result = (await response.json()) as { shareUrl?: string };
      if (!result.shareUrl) throw new Error("proof share url missing");
      setProofShareUrl(result.shareUrl);
      try {
        await navigator.clipboard.writeText(result.shareUrl);
        notify(progressCopy.proofShareCreatedAndCopied);
      } catch {
        notify(progressCopy.proofShareCreated);
      }
    } catch (shareError) {
      notify(shareError instanceof Error ? shareError.message : progressCopy.proofShareFailed);
    } finally {
      setCreatingProofShare(false);
    }
  }

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">EVIDENCE, NOT CHECKBOXES</span>
        <h1>{copy.ui.progressTitle}</h1>
        <p>{copy.ui.progressDescription}</p>
      </section>
      <section className="day-progress-card">
        <div className="big-day">
          <span>{progressCopy.currentLearningDay}</span>
          <strong>{String(data.enrollments[0]?.currentDay ?? 1).padStart(2, "0")}</strong>
          <small>/ 60 DAYS</small>
        </div>
        <div className="overall-line">
          <div>
            <span>{progressCopy.todayCompletion}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="long-progress">
            <span style={{ width: `${Math.max(progress, 3)}%` }} />
          </div>
        </div>
      </section>
      <section className="stat-grid">
        <article>
          <span>{progressCopy.completed}</span>
          <strong>{completedCount}</strong>
          <small>{progressCopy.totalCourses(data.today.length)}</small>
        </article>
        <article>
          <span>{progressCopy.learningEvidence}</span>
          <strong>{evidence}</strong>
          <small>{progressCopy.acceptedEvidence}</small>
        </article>
        <article>
          <span>{progressCopy.ruleAverage}</span>
          <strong>{averageScore ?? "—"}</strong>
          <small>{progressCopy.outOf100}</small>
        </article>
        <article>
          <span>{progressCopy.effectiveLearningDays}</span>
          <strong>{data.metrics.effectiveLearningDays}</strong>
          <small>
            {progressCopy.currentStreak(data.metrics.currentEffectiveStreak)}
          </small>
        </article>
      </section>
      <section className="stat-grid">
        <article>
          <span>{progressCopy.fwpr7}</span>
          <strong>
            {data.metrics.goalMetrics.fwpr7.achieved
              ? progressCopy.achieved
              : data.metrics.goalMetrics.fwpr7.eligible
                ? progressCopy.pending
                : progressCopy.notReady}
          </strong>
          <small>{progressCopy.fwpr7Hint}</small>
        </article>
        <article>
          <span>{progressCopy.day21Dod}</span>
          <strong>
            {data.metrics.goalMetrics.day21Dod.achieved
              ? progressCopy.achieved
              : progressCopy.pending}
          </strong>
          <small>{progressCopy.day21DodHint}</small>
        </article>
        <article>
          <span>{progressCopy.goalEvidenceRate}</span>
          <strong>{data.metrics.goalMetrics.evidenceSubmissionRate}%</strong>
          <small>
            {progressCopy.goalEvidenceCount(
              data.metrics.goalMetrics.completedCheckpointCount,
              data.metrics.goalMetrics.requiredCheckpointCount,
            )}
          </small>
        </article>
        <article>
          <span>{progressCopy.runtimeEvidence}</span>
          <strong>{data.metrics.evidenceMetrics.byType.runtimeSuccess}</strong>
          <small>{progressCopy.runtimeEvidenceHint}</small>
        </article>
      </section>
      <section className="competency-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">COMPETENCY GRAPH</span>
            <h2>{progressCopy.competencyTitle}</h2>
          </div>
          <div className="competency-proof-actions">
            <strong>{data.metrics.competencyGraph.overallScore}%</strong>
            <button
              type="button"
              onClick={() => void exportCompetencyProof("json")}
              disabled={exportingProof != null}
            >
              {exportingProof === "json" ? progressCopy.exporting : progressCopy.exportJson}
            </button>
            <button
              type="button"
              onClick={() => void exportCompetencyProof("markdown")}
              disabled={exportingProof != null}
            >
              {exportingProof === "markdown"
                ? progressCopy.exporting
                : progressCopy.exportMarkdown}
            </button>
            <button
              type="button"
              onClick={() => void createProofShare()}
              disabled={creatingProofShare}
            >
              {creatingProofShare
                ? progressCopy.creatingProofShare
                : progressCopy.createProofShare}
            </button>
          </div>
        </div>
        <p>{progressCopy.competencySubtitle}</p>
        {proofShareUrl ? (
          <div className="competency-share-link">
            <span>{progressCopy.publicProofPage}</span>
            <a href={proofShareUrl} target="_blank" rel="noreferrer">
              {proofShareUrl}
            </a>
          </div>
        ) : null}
        <div className="competency-node-list">
          {data.metrics.competencyGraph.nodes.map((node) => (
            <article className={`competency-node competency-${node.status}`} key={node.id}>
              <div>
                <span>{node.status.replace("_", " ")}</span>
                <strong>{node.title}</strong>
                <small>{node.description}</small>
              </div>
              <div className="competency-score">
                <b>{node.score}</b>
                <small>{progressCopy.evidenceCount(node.evidenceCount)}</small>
              </div>
              <i style={{ width: `${Math.max(node.score, 3)}%` }} />
            </article>
          ))}
        </div>
      </section>
      <section className="stat-grid">
        <article>
          <span>{progressCopy.quizFirstPassRate}</span>
          <strong>{data.metrics.quizMetrics.firstPassRate}%</strong>
          <small>
            {progressCopy.quizFirstPassCount(
              data.metrics.quizMetrics.firstPassCount,
              data.metrics.quizMetrics.firstAttemptCount,
            )}
          </small>
        </article>
        <article>
          <span>{progressCopy.quizRevisionPassRate}</span>
          <strong>{data.metrics.quizMetrics.revisionPassAfterFailRate}%</strong>
          <small>
            {progressCopy.quizRevisionPassCount(
              data.metrics.quizMetrics.revisionPassAfterFailCount,
              data.metrics.quizMetrics.firstFailCount,
            )}
          </small>
        </article>
        <article>
          <span>{progressCopy.quizQuestionAccuracy}</span>
          <strong>{data.metrics.quizMetrics.questionAccuracyRate}%</strong>
          <small>{progressCopy.quizAttemptCount(data.metrics.quizMetrics.attemptCount)}</small>
        </article>
        <article>
          <span>{progressCopy.quizNeedsReview}</span>
          <strong>
            {Math.max(
              0,
              data.metrics.quizMetrics.firstFailCount -
                data.metrics.quizMetrics.revisionPassAfterFailCount,
            )}
          </strong>
          <small>{progressCopy.quizNeedsReviewHint}</small>
        </article>
      </section>
      {data.supervision.lagDays > 0 && (
        <section className="lag-warning">
          <span>{progressCopy.noSkipping}</span>
          <p>{progressCopy.lagWarning(data.supervision.lagDays)}</p>
        </section>
      )}
      <section className="subject-progress">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACTIVE COURSES</span>
            <h2>{progressCopy.independentCourseProgress}</h2>
          </div>
        </div>
        {data.enrollments.map((enrollment) => {
          const item = data.today.find(
            (today) => today.enrollment.id === enrollment.id,
          );
          const done = item ? hasAcceptedMainlineEvidence(item) : false;
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
              <h2>{progressCopy.stageAssessments}</h2>
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
              <small>
                {item.completed
                  ? progressCopy.viewOrResubmit
                  : progressCopy.assessmentPending(item.label)}
              </small>
            </button>
          ))}
        </section>
      )}
      <AssessmentComparison data={data} />
      <section className="stat-grid">
        <article>
          <span>{progressCopy.selfCompleted}</span>
          <strong>{data.metrics.completionBreakdown.self}</strong>
          <small>{progressCopy.selfCompletedHint}</small>
        </article>
        <article>
          <span>{progressCopy.promptedCompleted}</span>
          <strong>{data.metrics.completionBreakdown.prompted}</strong>
          <small>{progressCopy.afterL1L2}</small>
        </article>
        <article>
          <span>{progressCopy.supervisedCompleted}</span>
          <strong>{data.metrics.completionBreakdown.supervised}</strong>
          <small>{progressCopy.afterL3L4}</small>
        </article>
      </section>
      <section className="stat-grid">
        <article>
          <span>{progressCopy.remindersDelivered}</span>
          <strong>{data.metrics.reminderMetrics.deliveredCount}</strong>
          <small>{progressCopy.deliveredHint}</small>
        </article>
        <article>
          <span>{progressCopy.completedAfterReminder}</span>
          <strong>{data.metrics.reminderMetrics.completedCount}</strong>
          <small>
            {progressCopy.averageMinutes(
              data.metrics.reminderMetrics.averageCompletionMinutes,
            )}
          </small>
        </article>
        <article>
          <span>{progressCopy.highIntensityCompleted}</span>
          <strong>
            {data.metrics.reminderMetrics.byLevel.l3 +
              data.metrics.reminderMetrics.byLevel.l4}
          </strong>
          <small>{progressCopy.l3L4Conversion}</small>
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
  const [testingReminder, setTestingReminder] = useState(false);
  const [paymentResult, setPaymentResult] = useState<
    PaymentResultState | null
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
  const currentPaymentStatus = paymentResult
    ? paymentStatusContent(copy, paymentResult)
    : null;
  const profileCopy = profileRuntimeCopy(locale);
  const reminderDiagnostic = reminderDiagnosticCopy(
    locale,
    data.reminderDiagnostic,
  );

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
      const text = profileCopy.shareText;
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
      notify(profileCopy.shareCopied);
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }
      notify(profileCopy.shareFailed);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(data.referral.code);
      notify(profileCopy.inviteCodeCopied);
    } catch {
      notify(profileCopy.inviteCodeFallback(data.referral.code));
    }
  }

  async function sendTestReminder() {
    setTestingReminder(true);
    try {
      const result = await academyRequest<{
        delivered: boolean;
        deliveryReason: string;
      }>("/api/academy/reminders/test", {
        method: "POST",
        body: JSON.stringify({}),
      });
      notify(
        result.delivered
          ? testReminderCopy(locale).sent
          : testReminderCopy(locale).skipped(result.deliveryReason),
      );
      await onPaymentFinished();
    } catch (requestError) {
      notify(
        requestError instanceof Error
          ? requestError.message
          : testReminderCopy(locale).failed,
      );
    } finally {
      setTestingReminder(false);
    }
  }

  function trackProfileConversion(eventType: string, planKey?: string) {
    void academyRequest<{ event: unknown }>("/api/academy/conversion-events", {
      method: "POST",
      body: JSON.stringify({
        eventType,
        planKey,
        metadata: { locale, source: "profile" },
      }),
    }).catch(() => undefined);
  }

  async function startStarsPayment(planKey: string, enabled: boolean) {
    trackProfileConversion("price_clicked", planKey);
    if (!enabled) {
      notify(starsStatusCopy(locale).planDisabled);
      return;
    }
    if (!window.Telegram?.WebApp?.openInvoice) {
      notify(copy.paymentOpenInTelegramRequired);
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
          : copy.pricingPreviewFailed,
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
          notify(paymentStatusContent(copy, status).title);
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
        if (status === "failed" || status === "cancelled") {
          notify(paymentStatusContent(copy, status).title);
        }
      });
    } catch (paymentError) {
      setPayingPlan(null);
      notify(
        paymentError instanceof Error
          ? paymentError.message
          : copy.paymentInvoiceFailed,
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
              : profileCopy.telegramUsernameMissing}
          </p>
        </div>
      </section>

      <section className="profile-facts" aria-label={profileCopy.telegramProfileLabel}>
        <div>
          <span>Telegram ID</span>
          <strong>{data.user.telegramId ?? profileCopy.localFounderMode}</strong>
        </div>
        <div>
          <span>{copy.telegramLanguage}</span>
          <strong>{data.user.languageCode ?? profileCopy.notProvided}</strong>
        </div>
        <div>
          <span>{copy.timezone}</span>
          <strong>{data.user.timezone}</strong>
        </div>
        <div>
          <span>{copy.activeCourses}</span>
          <strong>{profileCopy.courseCount(data.enrollments.length)}</strong>
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

      <section className="language-card" aria-label={profileCopy.reminderPreferences}>
        <div>
          <span className="eyebrow">REMINDERS</span>
          <h2>{profileCopy.remindersTitle}</h2>
          <p>{profileCopy.remindersDescription}</p>
        </div>
        <div className="language-actions reminder-settings-grid">
          <label className="setting-stack">
            <span>{profileCopy.reminderStatus}</span>
            <select
              value={reminderEnabled ? "on" : "off"}
              onChange={(event) => setReminderEnabled(event.target.value === "on")}
            >
              <option value="on">{profileCopy.on}</option>
              <option value="off">{profileCopy.off}</option>
            </select>
          </label>
          <label className="setting-stack">
            <span>{profileCopy.learningHour}</span>
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
            <span>{profileCopy.dndStart}</span>
            <select
              value={dndStartHour === "" ? "" : String(dndStartHour)}
              onChange={(event) =>
                setDndStartHour(event.target.value === "" ? "" : Number(event.target.value))
              }
            >
              <option value="">{profileCopy.notSet}</option>
              {Array.from({ length: 24 }, (_, hour) => (
                <option value={hour} key={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label className="setting-stack">
            <span>{profileCopy.dndEnd}</span>
            <select
              value={dndEndHour === "" ? "" : String(dndEndHour)}
              onChange={(event) =>
                setDndEndHour(event.target.value === "" ? "" : Number(event.target.value))
              }
            >
              <option value="">{profileCopy.notSet}</option>
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
            {savingLocale ? copy.saving : profileCopy.saveSettings}
          </button>
        </div>
      </section>

      <section className="reminder-history" aria-label="Reminder history">
        <div className="reminder-diagnostic">
          <span className="eyebrow">REMINDER DIAGNOSTIC</span>
          <h2>{reminderDiagnostic.title}</h2>
          <p>{reminderDiagnostic.reason}</p>
          <div className="reminder-diagnostic-grid">
            <div>
              <span>{reminderDiagnostic.nextLabel}</span>
              <strong>
                {data.reminderDiagnostic.nextReminderLocal ??
                  (data.reminderDiagnostic.reason === "eligible_now"
                    ? reminderDiagnostic.now
                    : "—")}
              </strong>
            </div>
            <div>
              <span>{reminderDiagnostic.lastLabel}</span>
              <strong>
                {data.reminderDiagnostic.lastEvent
                  ? `${reminderHistoryStatus(locale, {
                      id: 0,
                      level: data.reminderDiagnostic.lastEvent.level,
                      deliveryStatus: data.reminderDiagnostic.lastEvent.deliveryStatus,
                      sentAt: data.reminderDiagnostic.lastEvent.sentAt,
                      deliveredAt: data.reminderDiagnostic.lastEvent.deliveredAt,
                      clickedAt: null,
                      completedAt: null,
                    })} · L${data.reminderDiagnostic.lastEvent.level}`
                  : reminderDiagnostic.none}
              </strong>
            </div>
          </div>
          <small>{reminderDiagnostic.subtitle}</small>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void sendTestReminder()}
            disabled={testingReminder}
          >
            {testingReminder
              ? testReminderCopy(locale).sending
              : testReminderCopy(locale).button}
          </button>
        </div>
        <div className="section-heading">
          <div>
            <span className="eyebrow">REMINDER STATUS</span>
            <h2>{reminderHistoryTitle(locale)}</h2>
          </div>
          <small>{reminderHistorySummary(locale, data.reminderHistory)}</small>
        </div>
        {data.reminderHistory.length === 0 ? (
          <p className="reminder-history-empty">{reminderHistoryEmpty(locale)}</p>
        ) : (
          <div className="reminder-history-list">
            {data.reminderHistory.map((event) => (
              <article className="reminder-history-row" key={event.id}>
                <span className={`reminder-status-dot is-${event.deliveryStatus}`} />
                <div>
                  <strong>{reminderHistoryStatus(locale, event)}</strong>
                  <small>{formatReminderTimestamp(event.sentAt, locale)}</small>
                </div>
                <em>L{event.level}</em>
              </article>
            ))}
          </div>
        )}
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
      <section className="referral-list" aria-label={copy.creditsLedgerTitle}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">CREDITS LEDGER</span>
            <h2>{copy.creditsLedgerTitle}</h2>
          </div>
        </div>
        {data.credits.ledger.length === 0 ? (
          <p className="reminder-history-empty">{copy.creditsLedgerEmpty}</p>
        ) : (
          data.credits.ledger.map((entry) => (
            <article className="referral-item" key={entry.id}>
              <div>
                <strong>{creditsLedgerTypeCopy(locale, entry.rewardType)}</strong>
                <span>{formatShortDate(entry.createdAt)}</span>
              </div>
              <div>
                <strong>{formatCreditsAmount(entry.amountPoints)}</strong>
                <span>{creditsLedgerStatusCopy(locale, entry.status)}</span>
              </div>
            </article>
          ))
        )}
      </section>

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
            {data.access.active
              ? profileCopy.days(data.access.daysRemaining)
              : profileCopy.locked}
          </strong>
        </div>
        <p>
          {data.access.active
            ? profileCopy.accessActiveUntil(formatShortDate(data.access.accessEndsAt))
            : profileCopy.accessLockedDescription}
        </p>
        <section
          className="continuation-card"
          aria-label={profileCopy.continuationRulesLabel}
        >
          <div>
            <span>{profileCopy.continuationPrimary}</span>
            <strong>
              {profileCopy.monthlyPrice(data.access.continuation.primaryUsdPrice)}
              {data.access.continuation.primaryStars
                ? profileCopy.starsAmount(data.access.continuation.primaryStars)
                : ` · ${profileCopy.starsPending}`}
            </strong>
          </div>
          <div>
            <span>{profileCopy.continuationCredits}</span>
            <strong>
              {data.access.continuation.creditsAvailablePoints} pts ·{" "}
              {profileCopy.maxRedeem(data.access.continuation.maxRedeemablePercent)}
            </strong>
          </div>
          <div>
            <span>{profileCopy.continuationReferral}</span>
            <strong>
              {data.access.continuation.qualifiedInvites}/
              {data.access.continuation.referralRewardTarget}
              {data.access.continuation.qualifiedInvitesNeeded > 0
                ? ` · ${profileCopy.needMore(data.access.continuation.qualifiedInvitesNeeded)}`
                : ` · ${profileCopy.referralTargetDone}`}
            </strong>
          </div>
        </section>
        <div className="pricing-grid" aria-label={profileCopy.pricingGridLabel}>
          {data.payment.plans.map((plan) => (
            <button
              type="button"
              key={plan.key}
              disabled={payingPlan !== null || lockingPricing || !plan.enabled}
              onClick={() => startStarsPayment(plan.key, plan.enabled)}
            >
              <span>
                {profileCopy.days(plan.durationDays)}
                {plan.recurring ? profileCopy.recurringSuffix : ""}
              </span>
              <strong>{plan.stars ? `⭐ ${plan.stars}` : profileCopy.starsPending}</strong>
              <small>
                {profileCopy.targetPrice(plan.usdPrice)}
                {payingPlan === plan.key ? profileCopy.creatingInvoiceSuffix : ""}
                {" · "}
                {plan.enabled
                  ? starsStatusCopy(locale).ready(plan.configuredBy)
                  : starsStatusCopy(locale).disabledReason(plan.disabledReason)}
              </small>
            </button>
          ))}
        </div>
        <div className="invite-code-row" aria-label={profileCopy.creditsToggleLabel}>
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
            ? profileCopy.paymentEnabledNote
            : profileCopy.paymentDisabledNote}
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
        {(currentPaymentStatus || data.payment.enabled) && (
          <section
            className={`payment-state-card ${
              paymentResult ? `is-${paymentResult}` : "is-policy"
            }`}
            role="status"
          >
            <strong>
              {currentPaymentStatus?.title ?? copy.paymentRefundTitle}
            </strong>
            <p>
              {currentPaymentStatus?.detail ?? copy.paymentRefundPolicy}
            </p>
          </section>
        )}
      </section>

      <section className="referral-card">
        <div className="referral-heading">
          <div>
            <span className="eyebrow">LEARN WITH FRIENDS</span>
            <h2>{copy.referralTitle}</h2>
          </div>
          <strong>
            {qualifiedInvites} {profileCopy.invitedUnit}
          </strong>
        </div>
        <p>{copy.referralRule}</p>
        <small className="qualification-note">{copy.referralValidBehavior}</small>
        <div className="referral-progress" aria-label={profileCopy.referralProgressLabel(referralProgress)}>
          <span style={{ width: `${Math.max(referralProgress, 2)}%` }} />
        </div>
        <div className="invite-stats">
          <div>
            <strong>{data.referral.total}</strong>
            <span>{profileCopy.entered}</span>
          </div>
          <div>
            <strong>{data.referral.pending}</strong>
            <span>{profileCopy.learning}</span>
          </div>
          <div>
            <strong>{data.referral.review}</strong>
            <span>{profileCopy.review}</span>
          </div>
          <div>
            <strong>{data.referral.qualified}</strong>
            <span>{profileCopy.qualified}</span>
          </div>
          <div>
            <strong>{data.referral.rejected}</strong>
            <span>{profileCopy.rejected}</span>
          </div>
        </div>
        <div className="invite-code-row">
          <div>
            <span>{profileCopy.myInviteCode}</span>
            <strong>{data.referral.code}</strong>
          </div>
          <button type="button" onClick={copyCode}>
            {profileCopy.copy}
          </button>
        </div>
        <button className="primary-button share-button" type="button" onClick={shareAcademy}>
          {profileCopy.shareMiniApp}
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
                      ? profileCopy.qualified
                      : item.status === "rejected"
                        ? profileCopy.rejected
                      : item.status === "review"
                        ? profileCopy.review
                        : profileCopy.learning}
                  </strong>
                  <span>
                    {item.rewardGrantedAt
                      ? profileCopy.rewardGranted(formatShortDate(item.rewardGrantedAt))
                      : item.qualifiedAt
                        ? profileCopy.qualifiedAt(formatShortDate(item.qualifiedAt))
                        : profileCopy.joinedAt(formatShortDate(item.createdAt))}
                  </span>
                </div>
                {item.riskSignals.length > 0 && (
                  <small className="qualification-note">
                    {profileCopy.riskSignals(item.riskSignals.join(" / "))}
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
          <h2>{progressCopy.baselineVsCheckpointTitle}</h2>
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
  locale,
  existing,
  courseTitle,
  onClose,
  onSubmitted,
}: {
  assessment: DueAssessment;
  locale: AppLocale;
  existing: AbilityAssessment | null;
  courseTitle: string;
  onClose: () => void;
  onSubmitted: (bootstrap: Bootstrap, assessment: AbilityAssessment) => void;
}) {
  const copy = assessmentRuntimeCopy(locale);
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
        requestError instanceof Error ? requestError.message : copy.submitFailed,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lesson-page">
      <header className="lesson-page-header">
        <button type="button" onClick={onClose}>
          {copy.backProgress}
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
          <span>{copy.whyNow}</span>
          <p>{copy.whyNowBody(assessment.label)}</p>
        </section>

        <section className="lesson-reading">
          <span className="eyebrow">01 · PROMPT</span>
          <h2>{copy.stageTask}</h2>
          <p>{assessment.prompt}</p>
        </section>

        <section className="practice-card">
          <span className="eyebrow">02 · RUBRIC</span>
          <h2>{copy.rubricTitle}</h2>
          <div className="criteria-row">
            {assessment.rubric.map((criterion) => (
              <span key={criterion}>{criterion}</span>
            ))}
          </div>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={copy.answerPlaceholder}
            maxLength={5000}
          />
          <div className="lesson-submit-bar">
            <div className="answer-meta">
              <span>{copy.wordCount(answer.trim().length)}</span>
              {error && <strong>{error}</strong>}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => void submit()}
              disabled={submitting || answer.trim().length < 30}
            >
              {submitting
                ? copy.recording
                : existing
                  ? copy.resubmit
                  : copy.submitAssessment}
            </button>
          </div>
        </section>

        {existing && (
          <section className={`feedback-card ${existing.status === "completed" ? "passed" : ""}`}>
            <div className="score-row">
              <span>{copy.currentScore}</span>
              <strong>{Math.round(existing.score)}</strong>
            </div>
            <p>{existing.notes ?? copy.recordedFallback}</p>
          </section>
        )}
      </div>
    </div>
  );
}

function ReviewQueueSheet({
  item,
  locale,
  relatedAssessment,
  relatedLesson,
  onClose,
  onOpenAssessment,
  onOpenLesson,
  onOpenHistoricalLesson,
  onResolved,
}: {
  item: Bootstrap["reviewQueue"][number];
  locale: AppLocale;
  relatedAssessment: DueAssessment | null;
  relatedLesson: TodayItem | null;
  onClose: () => void;
  onOpenAssessment: (assessment: DueAssessment) => void;
  onOpenLesson: (item: TodayItem) => void;
  onOpenHistoricalLesson: (lessonId: string) => Promise<void> | void;
  onResolved: (bootstrap: Bootstrap) => void;
}) {
  const copy = reviewRuntimeCopy(locale);
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
        requestError instanceof Error ? requestError.message : copy.resolveFailed,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="lesson-page">
      <header className="lesson-page-header">
        <button type="button" onClick={onClose}>
          {copy.backToday}
        </button>
        <span>REVIEW · {item.reason === "weekly_review" ? copy.weeklyReview : copy.recoveryMission}</span>
      </header>
      <div className="lesson-page-content">
        <p className="lesson-kicker">REVIEW QUEUE · {item.sourceType.toUpperCase()}</p>
        <h1>{item.title}</h1>

        <section className="objective-block">
          <span>{copy.whyReturned}</span>
          <p>{item.recommendation}</p>
        </section>

        <section className="lesson-reading">
          <span className="eyebrow">01 · NEXT ACTION</span>
          <h2>{copy.nextAction}</h2>
          <p>
            {item.sourceType === "assessment"
              ? copy.assessmentAction
              : copy.lessonAction}
          </p>
        </section>

        <section className="practice-card">
          <span className="eyebrow">02 · DO SOMETHING REAL</span>
          <h2>{copy.resolveTitle}</h2>
          <div className="invite-code-row">
            {relatedAssessment && (
              <button
                className="primary-button"
                type="button"
                onClick={() => onOpenAssessment(relatedAssessment)}
              >
                {copy.openAssessment}
              </button>
            )}
            {relatedLesson && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => onOpenLesson(relatedLesson)}
              >
                {copy.openLesson}
              </button>
            )}
            {!relatedLesson && item.lessonId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => void onOpenHistoricalLesson(item.lessonId)}
              >
                {copy.openHistoricalLesson}
              </button>
            )}
          </div>
          <div className="lesson-submit-bar">
            <div className="answer-meta">
              <span>{copy.resolveHint}</span>
              {error && <strong>{error}</strong>}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => void resolve()}
              disabled={saving}
            >
              {saving ? copy.closing : copy.markDone}
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

function formatCreditsAmount(points: number) {
  const amount = Number(points);
  const prefix = amount > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("en-US").format(amount)} pts`;
}

function formatReminderTimestamp(value: string, locale: AppLocale) {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(dateLocaleFor(locale), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
