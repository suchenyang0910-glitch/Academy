"use client";

import { useEffect, useRef, useState } from "react";
import { listeningLessons, LISTENING_STAGES, readableStage, stageIndex, type ListeningFeedback, type ListeningLesson, type ListeningSession, type ListeningStage } from "../lib/english-listening";

type Material = ListeningLesson;
type ApiPayload = { session: ListeningSession; material: Material; feedback?: ListeningFeedback };
type Props = { lessonId: string; readOnly?: boolean };
const localKey = (lessonId: string) => `academy:listening:draft:${lessonId}`;
const initHeaders = () => ({ "content-type": "application/json", "x-telegram-init-data": window.Telegram?.WebApp?.initData ?? "" });

export function EnglishListeningPanel({ lessonId, readOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  return <section className="listening-panel" aria-label="英语听力训练">
    <span className="eyebrow">LISTEN FIRST · 英语听力</span>
    <h2>先听懂，再回应</h2>
    <p>5–10 分钟场景练习。结果单独保存，不会替代或自动完成今日英语课程。</p>
    <button className="secondary-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      {open ? "收起听力练习" : "开始听力练习"}
    </button>
    {open && <ListeningWorkspace lessonId={lessonId} readOnly={readOnly} />}
  </section>;
}

function ListeningWorkspace({ lessonId, readOnly = false }: Props) {
  const [chosen, setChosen] = useState(listeningLessons[0]?.id ?? "");
  const [session, setSession] = useState<ListeningSession | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [feedback, setFeedback] = useState<ListeningFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [reflection, setReflection] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const generation = useRef(0);
  const pending = useRef<{ signature: string; requestId: string } | null>(null);
  const current = material ?? listeningLessons.find((item) => item.id === chosen) ?? null;

  useEffect(() => {
    let alive = true;
    const speechGeneration = generation;
    const controller = new AbortController();
    fetch(`/api/academy/listening-sessions?lessonId=${encodeURIComponent(lessonId)}`, { headers: initHeaders(), signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("无法读取上次练习");
        const data = await response.json() as { sessions: ListeningSession[] };
        const active = data.sessions.find((item) => item.status === "active");
        if (!active) return;
        const detail = await fetch(`/api/academy/listening-sessions?sessionId=${encodeURIComponent(active.id)}`, { headers: initHeaders(), signal: controller.signal });
        if (!detail.ok) throw new Error("无法恢复上次练习");
        const restored = await detail.json() as ApiPayload;
        if (alive) { setSession(restored.session); setMaterial(restored.material); setChosen(restored.material.id); setShowTranscript(stageIndex(restored.session.stage) >= stageIndex("explain")); }
      }).catch((reason: unknown) => { if (!controller.signal.aborted && alive) setError(reason instanceof Error ? reason.message : "无法读取上次练习"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.abort(); speechGeneration.current++; window.speechSynthesis?.cancel(); };
  }, [lessonId]);

  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(localKey(lessonId), JSON.stringify({ sessionId: session.id, version: session.version, answers: session.answersDraft, stage: session.stage, reflection })); } catch { /* server record remains authoritative */ }
  }, [lessonId, reflection, session]);

  function requestId(signature: string) {
    if (pending.current?.signature !== signature) pending.current = { signature, requestId: crypto.randomUUID() };
    return pending.current.requestId;
  }
  async function act(input: Record<string, unknown>, keepRequest = false) {
    const signature = JSON.stringify(input);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/academy/listening-sessions", { method: "POST", headers: initHeaders(), body: JSON.stringify({ ...input, requestId: requestId(signature) }) });
      const data = await response.json().catch(() => null) as (ApiPayload & { error?: { code?: string; message?: string } }) | null;
      if (!response.ok || !data) throw new Error(data?.error?.message ?? "本次操作没有保存，请检查网络后重试。");
      setSession(data.session); setMaterial(data.material); setFeedback(data.feedback ?? null); setChosen(data.material.id);
      if (!keepRequest) pending.current = null;
      return data;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "本次操作没有保存，请检查网络后重试。");
      return null;
    } finally { setBusy(false); }
  }
  async function start() {
    setFeedback(null); setShowTranscript(false); setReflection("");
    await act({ action: "start", lessonId, materialId: chosen, mode: "practice" });
  }
  function stop() { generation.current++; window.speechSynthesis?.cancel(); setPlaying(false); }
  function speak(text: string, kind: "full" | "line" | "slow" = "full", itemId?: string) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !session) { setError("当前设备不能播放英语语音。可以先阅读文字学习，但本次不能算作独立听力。 "); return; }
    stop(); const token = ++generation.current; const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; utterance.rate = kind === "slow" ? 0.65 : 0.85;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith("en")); if (voice) utterance.voice = voice;
    setPlaying(true);
    utterance.onend = () => { if (generation.current !== token) return; setPlaying(false); void act({ action: "event", sessionId: session.id, version: session.version, eventType: kind === "full" ? "audio_completed" : kind === "slow" ? "slow_audio" : "line_audio", ...(itemId ? { itemId } : {}) }); };
    utterance.onerror = () => { if (generation.current === token) { setPlaying(false); setError("播放失败，请重试或使用文字帮助。 "); void act({ action: "event", sessionId: session.id, version: session.version, eventType: "audio_failed" }); } };
    window.speechSynthesis.speak(utterance);
  }
  async function saveAnswers(answers: Record<string, string>, stage: ListeningStage = "answer") {
    if (!session) return;
    await act({ action: "save", sessionId: session.id, version: session.version, answersDraft: answers, stage });
  }
  async function revealTranscript() {
    if (!session) return; setShowTranscript(true);
    await act({ action: "event", sessionId: session.id, version: session.version, eventType: "transcript_opened" });
  }
  if (loading) return <p role="status">正在恢复练习记录…</p>;
  if (!current) return null;
  const stage = session?.stage ?? "ready";
  const practiceReady = Boolean(session && (session.support as Record<string, number>).audio_completed >= 1);
  const questions = stage === "transfer" ? [current.transfer.question] : current.questions;
  const answers = session?.answersDraft ?? {};
  return <div className="listening-workspace">
    {readOnly && <p className="practice-locked">本课当前只读。历史练习仍可查看。</p>}
    <label>选择场景<select value={chosen} disabled={busy || Boolean(session?.status === "active")} onChange={(event) => { setChosen(event.target.value); setMaterial(null); setSession(null); setFeedback(null); }}>
      {listeningLessons.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
    </select></label>
    {!session && <button className="primary-button" type="button" disabled={busy || readOnly} onClick={() => void start()}>开始 {current.title}</button>}
    {session && <>
      <div className="listening-progress" aria-label={`当前步骤：${readableStage(stage)}`}>
        {LISTENING_STAGES.map((item) => <span key={item} className={stageIndex(item) <= stageIndex(stage) ? "done" : ""}>{readableStage(item)}</span>)}
      </div>
      <h3>{current.title}</h3><p>{current.goal}</p>
      {session.priorExposure && <p className="listening-note">你此前已做过这一题组；本次会作为复习记录，不标记为首次独立答对。</p>}
      {(stage === "ready" || stage === "listen") && <section className="listening-step">
        <h3>1. 先完整听一次</h3><p className="listening-note">设备合成语音仅为临时练习方式，口音和可用性因设备而异；原文默认隐藏。</p>
        <div className="listening-actions"><button className="primary-button" type="button" disabled={busy || playing || readOnly} onClick={() => speak(current.lines.map((line) => line.en).join(" "))}>播放完整对话</button>{playing && <button className="secondary-button" type="button" onClick={stop}>停止</button>}</div>
        <div className="listening-help"><button type="button" className="secondary-button" disabled={busy || !session || readOnly} onClick={() => speak(current.lines.map((line) => line.en).join(" "), "slow")}>慢速重听</button><button type="button" className="secondary-button" disabled={busy || !session} onClick={() => void revealTranscript()}>想看整句</button></div>
        {showTranscript && <Transcript material={current} playing={playing} onLine={(text, id) => speak(text, "line", id)} onTranslation={() => session && void act({ action: "event", sessionId: session.id, version: session.version, eventType: "translation_opened" })} />}
        {!practiceReady && <p className="listening-note">先完成一次原速完整播放，才进入理解检查。</p>}
        {practiceReady && <button type="button" className="primary-button" disabled={busy || readOnly} onClick={() => void act({ action: "save", sessionId: session.id, version: session.version, answersDraft: answers, stage: "answer" })}>进入理解检查</button>}
      </section>}
      {stage === "answer" && <QuestionStep questions={questions} answers={answers} disabled={busy || readOnly} onChange={(questionId, answerId) => void saveAnswers({ ...answers, [questionId]: answerId })} onSubmit={() => void act({ action: "submit", sessionId: session.id, version: session.version, answers })} />}
      {(stage === "feedback" || stage === "explain") && <section className="listening-step"><h3>3. 结果与回看</h3>{feedback ? <Feedback feedback={feedback} /> : <p>本题结果已保存。展开逐句内容后可针对听漏处复习。</p>}<button type="button" className="secondary-button" disabled={busy} onClick={() => { setShowTranscript(true); if (session) void act({ action: "event", sessionId: session.id, version: session.version, eventType: "feedback_opened" }); }}>逐句学习与讲解</button>{showTranscript && <Transcript material={current} playing={playing} onLine={(text, id) => speak(text, "line", id)} onTranslation={() => { if (session) void act({ action: "event", sessionId: session.id, version: session.version, eventType: "translation_opened" }); }} />}<button className="primary-button" type="button" disabled={busy || readOnly} onClick={() => { if (session) void act({ action: "save", sessionId: session.id, version: session.version, answersDraft: answers, stage: "transfer" }); }}>用新例子检查</button></section>}
      {stage === "transfer" && <section className="listening-step"><h3>4. 新例子</h3><p>这是不同细节的新句子，用来检查你能否迁移理解。</p><button className="secondary-button" type="button" disabled={playing || busy} onClick={() => speak(current.transfer.text)}>播放新例子</button><QuestionStep questions={[current.transfer.question]} answers={answers} disabled={busy || readOnly} onChange={(questionId, answerId) => void saveAnswers({ ...answers, [questionId]: answerId }, "transfer")} onSubmit={() => { if (session) void act({ action: "submit", sessionId: session.id, version: session.version, answers }); }} /></section>}
      {stage === "summary" && <section className="listening-step"><h3>5. 现实任务与总结</h3>{feedback && <Feedback feedback={feedback} />}<p>{current.mission}</p><label>简短记录：听懂了什么？哪里需要重复？<textarea rows={3} maxLength={600} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="可以只写一句；模拟练习请注明“模拟”。" /></label><div className="lesson-submit-bar"><button className="primary-button" type="button" disabled={busy || readOnly || session.status === "completed"} onClick={() => void act({ action: "finish", sessionId: session.id, version: session.version, reflection })}>{session.status === "completed" ? "本次练习已保存" : "保存本次练习"}</button></div></section>}
      {session.status === "completed" && <p role="status">已保存。本次是补充听力练习，不会改变旧课程通关状态。</p>}
    </>}
    {error && <div role="alert" className="english-error"><p>{error}</p><button className="secondary-button" type="button" disabled={busy} onClick={() => setError("")}>知道了</button></div>}
  </div>;
}

function QuestionStep({ questions, answers, disabled, onChange, onSubmit }: { questions: Array<{ id: string; prompt: string; options: { id: string; label: string }[] }>; answers: Record<string, string>; disabled: boolean; onChange: (questionId: string, answerId: string) => void; onSubmit: () => void }) {
  const complete = questions.every((question) => answers[question.id]);
  return <section className="listening-step"><h3>2. 理解检查</h3>{questions.map((question, index) => <fieldset key={question.id} className="listening-question"><legend>{index + 1}. {question.prompt}</legend>{question.options.map((option) => <label key={option.id}><input type="radio" name={question.id} checked={answers[question.id] === option.id} disabled={disabled} onChange={() => onChange(question.id, option.id)} />{option.label}</label>)}</fieldset>)}<div className="lesson-submit-bar"><button className="primary-button" type="button" disabled={disabled || !complete} onClick={onSubmit}>检查理解并保存</button></div></section>;
}
function Feedback({ feedback }: { feedback: ListeningFeedback }) { return <div className="feedback-card passed"><div><span>本次结果</span><strong>{feedback.correct}/{feedback.total}</strong></div><p>{feedback.priorExposure ? "已标记为复习成绩。" : "本次记录会保留所用帮助条件。"}</p>{feedback.explanations.map((item) => <p key={item.questionId}>{item.correct ? "✓" : "○"} {item.explanation}{item.lineId ? `（回看 ${item.lineId}）` : ""}</p>)}</div>; }
function Transcript({ material, playing, onLine, onTranslation }: { material: Material; playing: boolean; onLine: (text: string, id: string) => void; onTranslation: () => void }) { return <section className="listening-transcript"><h3>逐句学习</h3>{material.lines.map((line, index) => <article className="listening-line" key={line.id}><strong>{index + 1}. {line.en}</strong><p>{line.zh}</p><p>{line.note}</p><button type="button" className="secondary-button" disabled={playing} onClick={() => onLine(line.en, line.id)}>听这一句</button></article>)}<button type="button" className="secondary-button" onClick={onTranslation}>我看过译文</button></section>; }
