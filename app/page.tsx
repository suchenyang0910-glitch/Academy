"use client";

import { useEffect, useMemo, useState } from "react";

type Lesson = {
  id: string;
  number: string;
  subject: string;
  title: string;
  duration: string;
  accent: string;
  prompt: string;
};

const lessons: Lesson[] = [
  {
    id: "english",
    number: "01",
    subject: "English",
    title: "买与卖：把表达说得更自然",
    duration: "12 分钟",
    accent: "#bb6748",
    prompt: "跟读 3 轮，然后用 buy、sell、worth 各造一个句子。",
  },
  {
    id: "ai",
    number: "02",
    subject: "AI",
    title: "Attention：模型如何找到重点",
    duration: "15 分钟",
    accent: "#57705b",
    prompt: "用一句话解释 Attention，再写下一个工作中的类比。",
  },
  {
    id: "management",
    number: "03",
    subject: "Management",
    title: "把目标拆成可执行动作",
    duration: "12 分钟",
    accent: "#a48250",
    prompt: "选择一个本周目标，拆成三个今天能开始的动作。",
  },
  {
    id: "founder",
    number: "04",
    subject: "Founder Note",
    title: "今天最重要的一个决定",
    duration: "8 分钟",
    accent: "#68706c",
    prompt: "记录今天最重要的决定，以及你为什么这样选。",
  },
  {
    id: "quiz",
    number: "05",
    subject: "Quiz",
    title: "今日知识回顾",
    duration: "10 分钟",
    accent: "#8f786e",
    prompt: "完成 5 道题，检验今天的记忆与理解。",
  },
];

type Note = { id: number; day: number; content: string; date: string };

const starterNotes: Note[] = [
  {
    id: 1,
    day: 1,
    content: "Attention 不是记住所有信息，而是动态决定此刻应该关注什么。",
    date: "今天 · 14:32",
  },
  {
    id: 2,
    day: 1,
    content: "把英语例句换成自己的业务语境，会更容易真正记住。",
    date: "今天 · 10:18",
  },
];

const glyphs = {
  home: "⌂",
  note: "▤",
  progress: "▥",
  back: "‹",
  play: "▶",
  check: "✓",
  arrow: "›",
};

export default function Home() {
  const [tab, setTab] = useState<"today" | "notes" | "progress">("today");
  const [completed, setCompleted] = useState<string[]>(["english"]);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [notes, setNotes] = useState<Note[]>(starterNotes);
  const [draft, setDraft] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("academy-demo-state");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (Array.isArray(data.completed)) setCompleted(data.completed);
      if (Array.isArray(data.notes)) setNotes(data.notes);
    } catch {
      // Keep the polished demo defaults when local data is invalid.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "academy-demo-state",
      JSON.stringify({ completed, notes }),
    );
  }, [completed, notes]);

  const progress = Math.round((completed.length / lessons.length) * 100);
  const completedSubjects = useMemo(
    () => lessons.filter((lesson) => completed.includes(lesson.id)),
    [completed],
  );

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function toggleLesson(id: string) {
    setCompleted((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function saveNote() {
    const content = draft.trim();
    if (!content) {
      notify("先写下一点内容");
      return;
    }
    setNotes((current) => [
      {
        id: Date.now(),
        day: 1,
        content,
        date: "刚刚",
      },
      ...current,
    ]);
    setDraft("");
    setComposerOpen(false);
    notify("笔记已经收好");
  }

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
            <span>私人学习手账</span>
          </div>
          <button
            className="day-chip"
            type="button"
            onClick={() => setTab("progress")}
            aria-label="查看第 1 天学习进度"
          >
            DAY 01
          </button>
        </header>

        <div className="content">
          {tab === "today" && (
            <TodayView
              completed={completed}
              progress={progress}
              onSelect={setSelected}
              onToggle={toggleLesson}
              onOpenNote={() => setComposerOpen(true)}
            />
          )}
          {tab === "notes" && (
            <NotesView
              notes={notes}
              onOpenNote={() => setComposerOpen(true)}
            />
          )}
          {tab === "progress" && (
            <ProgressView
              progress={progress}
              completedSubjects={completedSubjects}
            />
          )}
        </div>

        <nav className="bottom-nav" aria-label="主要导航">
          <NavButton
            active={tab === "today"}
            icon={glyphs.home}
            label="今日"
            onClick={() => setTab("today")}
          />
          <NavButton
            active={tab === "notes"}
            icon={glyphs.note}
            label="笔记"
            onClick={() => setTab("notes")}
          />
          <NavButton
            active={tab === "progress"}
            icon={glyphs.progress}
            label="进度"
            onClick={() => setTab("progress")}
          />
        </nav>

        {selected && (
          <LessonSheet
            lesson={selected}
            completed={completed.includes(selected.id)}
            onClose={() => setSelected(null)}
            onToggle={() => {
              toggleLesson(selected.id);
              notify(
                completed.includes(selected.id)
                  ? "已标记为待学习"
                  : "完成一课，继续保持",
              );
            }}
            onNote={() => {
              setSelected(null);
              setComposerOpen(true);
            }}
          />
        )}

        {composerOpen && (
          <div
            className="sheet-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setComposerOpen(false);
            }}
          >
            <section className="composer" aria-label="新建学习笔记">
              <div className="sheet-handle" aria-hidden="true" />
              <div className="composer-head">
                <div>
                  <span className="eyebrow">DAY 01 · 学习记录</span>
                  <h2>写下此刻的想法</h2>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setComposerOpen(false)}
                >
                  取消
                </button>
              </div>
              <textarea
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="一个新发现、一句反思，或明天要继续的问题…"
                maxLength={500}
              />
              <div className="composer-foot">
                <span>{draft.length} / 500</span>
                <button className="primary-button" type="button" onClick={saveNote}>
                  保存笔记
                </button>
              </div>
            </section>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </section>
    </main>
  );
}

function TodayView({
  completed,
  progress,
  onSelect,
  onToggle,
  onOpenNote,
}: {
  completed: string[];
  progress: number;
  onSelect: (lesson: Lesson) => void;
  onToggle: (id: string) => void;
  onOpenNote: () => void;
}) {
  return (
    <>
      <section className="hero">
        <p className="greeting">晚上好，路飞</p>
        <h1>今日学习</h1>
        <p className="date-line">星期四 · 7 月 23 日</p>

        <div className="progress-summary">
          <div className="progress-copy">
            <span>今日完成</span>
            <strong>
              {completed.length}
              <small> / 5</small>
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

      <section className="lesson-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TODAY&apos;S FOCUS</span>
            <h2>五节课程</h2>
          </div>
          <span className="section-count">{completed.length}/5</span>
        </div>

        <div className="lesson-list">
          {lessons.map((lesson) => {
            const done = completed.includes(lesson.id);
            return (
              <article
                className={`lesson-row ${done ? "is-done" : ""}`}
                key={lesson.id}
                style={{ "--lesson-accent": lesson.accent } as React.CSSProperties}
              >
                <button
                  className="lesson-main"
                  type="button"
                  onClick={() => onSelect(lesson)}
                  aria-label={`打开 ${lesson.subject} 课程`}
                >
                  <span className="lesson-number">{lesson.number}</span>
                  <span className="lesson-copy">
                    <strong>{lesson.subject}</strong>
                    <span>{lesson.title}</span>
                  </span>
                  <span className="lesson-arrow" aria-hidden="true">
                    {glyphs.arrow}
                  </span>
                </button>
                <button
                  className="check-button"
                  type="button"
                  onClick={() => onToggle(lesson.id)}
                  aria-label={done ? `取消完成 ${lesson.subject}` : `完成 ${lesson.subject}`}
                  aria-pressed={done}
                >
                  {done ? glyphs.check : ""}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <button className="note-cta" type="button" onClick={onOpenNote}>
        <span className="note-symbol" aria-hidden="true">
          ✎
        </span>
        <span>
          <small>QUICK NOTE</small>
          <strong>写下今日笔记</strong>
        </span>
        <span className="cta-arrow" aria-hidden="true">
          {glyphs.arrow}
        </span>
      </button>

      <blockquote>
        “每天留下一个可回看的思想，学习才真正属于你。”
      </blockquote>
    </>
  );
}

function NotesView({
  notes,
  onOpenNote,
}: {
  notes: Note[];
  onOpenNote: () => void;
}) {
  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">LEARNING NOTES</span>
        <h1>学习笔记</h1>
        <p>把零散想法变成可以再次使用的知识。</p>
      </section>

      <button className="new-note-button" type="button" onClick={onOpenNote}>
        <span aria-hidden="true">＋</span>
        新建一条笔记
      </button>

      <section className="timeline">
        {notes.map((note) => (
          <article className="note-entry" key={note.id}>
            <div className="timeline-dot" aria-hidden="true" />
            <div className="note-meta">
              <span>DAY {String(note.day).padStart(2, "0")}</span>
              <time>{note.date}</time>
            </div>
            <p>{note.content}</p>
          </article>
        ))}
      </section>
    </>
  );
}

function ProgressView({
  progress,
  completedSubjects,
}: {
  progress: number;
  completedSubjects: Lesson[];
}) {
  const totalProgress = Math.round(((1 - 1) * 5 + completedSubjects.length) / 70 * 100);

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">YOUR RHYTHM</span>
        <h1>学习进度</h1>
        <p>不用追赶，只需要看见自己持续向前。</p>
      </section>

      <section className="day-progress-card">
        <div className="big-day">
          <span>当前进度</span>
          <strong>01</strong>
          <small>/ 14 DAYS</small>
        </div>
        <div className="overall-line">
          <div>
            <span>课程周期</span>
            <strong>{totalProgress}%</strong>
          </div>
          <div className="long-progress">
            <span style={{ width: `${Math.max(totalProgress, 3)}%` }} />
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <article>
          <span>今日完成</span>
          <strong>{completedSubjects.length}</strong>
          <small>共 5 节</small>
        </article>
        <article>
          <span>连续学习</span>
          <strong>1</strong>
          <small>天</small>
        </article>
        <article>
          <span>今日进度</span>
          <strong>{progress}%</strong>
          <small>保持节奏</small>
        </article>
      </section>

      <section className="subject-progress">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SUBJECTS</span>
            <h2>各科学习</h2>
          </div>
        </div>
        {lessons.map((lesson) => {
          const done = completedSubjects.some((item) => item.id === lesson.id);
          return (
            <div className="subject-line" key={lesson.id}>
              <span
                className="subject-swatch"
                style={{ background: lesson.accent }}
                aria-hidden="true"
              />
              <strong>{lesson.subject}</strong>
              <div className="mini-progress">
                <span style={{ width: done ? "100%" : "0%" }} />
              </div>
              <small>{done ? "1/1" : "0/1"}</small>
            </div>
          );
        })}
      </section>
    </>
  );
}

function LessonSheet({
  lesson,
  completed,
  onClose,
  onToggle,
  onNote,
}: {
  lesson: Lesson;
  completed: boolean;
  onClose: () => void;
  onToggle: () => void;
  onNote: () => void;
}) {
  return (
    <div
      className="sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="lesson-sheet"
        style={{ "--lesson-accent": lesson.accent } as React.CSSProperties}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <button className="sheet-back" type="button" onClick={onClose}>
          <span aria-hidden="true">{glyphs.back}</span> 返回今日
        </button>
        <span className="lesson-sheet-number">{lesson.number}</span>
        <p className="lesson-kicker">{lesson.subject.toUpperCase()}</p>
        <h2>{lesson.title}</h2>
        <div className="lesson-meta">
          <span>DAY 01</span>
          <span>{lesson.duration}</span>
          <span>{completed ? "已完成" : "待学习"}</span>
        </div>

        <section className="learning-block">
          <span className="eyebrow">TODAY&apos;S PRACTICE</span>
          <h3>今天要完成什么</h3>
          <p>{lesson.prompt}</p>
        </section>

        {lesson.id === "english" && (
          <button className="audio-row" type="button">
            <span className="play-button" aria-hidden="true">
              {glyphs.play}
            </span>
            <span>
              <strong>影子跟读练习</strong>
              <small>02:36 · 即将加入正式音频</small>
            </span>
            <span className="wave" aria-hidden="true">
              ıııııı
            </span>
          </button>
        )}

        <div className="lesson-actions">
          <button className="secondary-button" type="button" onClick={onNote}>
            记下想法
          </button>
          <button className="primary-button" type="button" onClick={onToggle}>
            {completed ? "标记为待学习" : "完成这节课"}
          </button>
        </div>
      </article>
    </div>
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
