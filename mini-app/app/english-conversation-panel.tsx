"use client";

import { useEffect, useRef, useState } from "react";
import { ENGLISH_LEVELS, ENGLISH_SCENARIOS, MAX_ENGLISH_TURNS, MIN_ENGLISH_TURNS, type EnglishAction, type EnglishLevel, type EnglishScenario, type EnglishSession } from "../lib/english-conversation";
import { englishConversationCopy } from "../lib/english-conversation-copy";
import type { AppLocale } from "../lib/i18n";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type Props = { lessonId: string; locale: AppLocale; readOnly: boolean };
export function EnglishConversationPanel(props: Props) {
  const [open, setOpen] = useState(false);
  const copy = englishConversationCopy(props.locale);
  return <section className="english-practice" aria-label={copy.title}>
    <span className="eyebrow">ENGLISH · CONVERSATION</span>
    <h2>{copy.title}</h2><p>{copy.intro}</p>
    <button className="secondary-button" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? copy.close : copy.open}</button>
    {open && <Conversation key={props.lessonId} {...props} />}
  </section>;
}

function Conversation({ lessonId, locale, readOnly }: Props) {
  const copy = englishConversationCopy(locale);
  const [sessions, setSessions] = useState<EnglishSession[]>([]);
  const [session, setSession] = useState<EnglishSession | null>(null);
  const [scenario, setScenario] = useState<EnglishScenario>("introduction");
  const [level, setLevel] = useState<EnglishLevel>("beginner");
  const [draft, setDraft] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "speech">("text");
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hint, setHint] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const recognition = useRef<Recognition | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ signature: string; requestId: string } | null>(null);
  const sending = useRef(false);
  const alive = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    const abort = new AbortController();
    fetch(`/api/academy/english-conversations?lessonId=${encodeURIComponent(lessonId)}`, {
      headers: { "x-telegram-init-data": window.Telegram?.WebApp?.initData ?? "" }, signal: abort.signal,
    }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { sessions: EnglishSession[]; aiEnabled: boolean };
      setSessions(data.sessions); setAiEnabled(data.aiEnabled);
      setSession(current => data.sessions.find(s => s.id === current?.id) ?? data.sessions.find(s => s.status === "active") ?? data.sessions[0] ?? null);
      setError("");
    }).catch(() => { if (!abort.signal.aborted) setError(copy.error); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [lessonId, refresh, copy.error]);

  useEffect(() => () => {
    alive.current = false;
    controller.current?.abort();
    if (recognition.current) { recognition.current.onresult = null; recognition.current.onerror = null; recognition.current.onend = null; recognition.current.abort(); }
    if (recordingTimer.current) clearTimeout(recordingTimer.current);
    window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "smooth" }); }, [session?.messages.length]);

  function speak(text: string) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setError(copy.audioFailed); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; utterance.rate = (session?.level ?? level) === "beginner" ? 0.8 : 0.95;
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.onerror = event => { if (alive.current && event.error !== "canceled" && event.error !== "interrupted") setError(copy.audioFailed); };
    window.speechSynthesis.speak(utterance);
  }
  function record() {
    if (recording) { recognition.current?.stop(); return; }
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor || !window.isSecureContext) { setError(copy.unsupported); return; }
    window.speechSynthesis?.cancel(); setError("");
    const next = new Constructor();
    recognition.current = next;
    next.lang = "en-US"; next.continuous = false; next.interimResults = false;
    next.onresult = event => {
      const text = Array.from(event.results).map(result => result[0]?.transcript ?? "").join(" ");
      setDraft(current => `${current} ${text}`.trim().slice(0, 1000)); setInputMode("speech");
    };
    next.onerror = () => setError(copy.speechFailed);
    next.onend = () => { setRecording(false); if (recordingTimer.current) clearTimeout(recordingTimer.current); };
    try { next.start(); setRecording(true); recordingTimer.current = setTimeout(() => next.stop(), 45_000); }
    catch { setRecording(false); setError(copy.speechFailed); }
  }
  async function act(input: Omit<Extract<EnglishAction, { action: "start" }>, "requestId"> | Omit<Extract<EnglishAction, { action: "reply" }>, "requestId"> | Omit<Extract<EnglishAction, { action: "finish" }>, "requestId">, practiceDraft?: string) {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError("");
    const signature = JSON.stringify(input);
    if (pending.current?.signature !== signature) pending.current = { signature, requestId: crypto.randomUUID() };
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 55_000);
    try {
      const response = await fetch("/api/academy/english-conversations", {
        method: "POST", signal: abort.signal,
        headers: { "content-type": "application/json", "x-telegram-init-data": window.Telegram?.WebApp?.initData ?? "" },
        body: JSON.stringify({ ...input, requestId: pending.current.requestId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) throw new Error(copy.limit);
        if (response.status === 402) throw new Error(copy.expired);
        if (response.status === 409) throw new Error(copy.conflict);
        if (data.error === "ai_unavailable") throw new Error(copy.service);
        throw new Error(copy.error);
      }
      if (!alive.current) return;
      const next = data.session as EnglishSession;
      setSession(next); setSessions(current => [next, ...current.filter(s => s.id !== next.id)].slice(0, 10));
      setDraft(practiceDraft ?? ""); setInputMode("text"); setHint(false); pending.current = null;
    } catch (e) { if (alive.current) setError(e instanceof Error && e.name !== "AbortError" ? e.message : copy.error); }
    finally { clearTimeout(timer); sending.current = false; if (alive.current) setBusy(false); }
  }
  const turns = session?.messages.filter(m => m.role === "user").length ?? 0;
  const disabled = busy || recording || readOnly || !aiEnabled || loading;
  return <div className="english-workspace">
    <p className="english-small">{copy.privacy}</p>
    {loading && <p role="status">{copy.loading}</p>}
    {!loading && !aiEnabled && <p>{copy.noAi}</p>}
    {readOnly && <p>{copy.readOnly}</p>}
    <div className="english-settings">
      <label>{copy.scene}<select value={scenario} disabled={disabled} onChange={e => setScenario(e.target.value as EnglishScenario)}>{Object.keys(ENGLISH_SCENARIOS).map((key, i) => <option key={key} value={key}>{copy.scenes[i]}</option>)}</select></label>
      <label>{copy.level}<select value={level} disabled={disabled} onChange={e => setLevel(e.target.value as EnglishLevel)}>{ENGLISH_LEVELS.map((key, i) => <option key={key} value={key}>{copy.levels[i]}</option>)}</select></label>
    </div>
    <button type="button" className="primary-button" disabled={disabled} onClick={() => void act({ action: "start", lessonId, scenario, level })}>{copy.start}</button>
    {sessions.length > 0 && <label className="english-history">{copy.history}<select value={session?.id ?? ""} disabled={busy || recording} onChange={e => { setSession(sessions.find(s => s.id === e.target.value) ?? null); setDraft(""); setHint(false); pending.current = null; window.speechSynthesis?.cancel(); }}>{sessions.map(s => <option key={s.id} value={s.id}>{new Date(s.createdAt).toLocaleString(locale)} · {copy.scenes[Object.keys(ENGLISH_SCENARIOS).indexOf(s.scenario)]} · {s.status === "active" ? copy.active : copy.completed}</option>)}</select></label>}
    {session && <>
      <p className="english-small">{copy.scenes[Object.keys(ENGLISH_SCENARIOS).indexOf(session.scenario)]} · {copy.levels[ENGLISH_LEVELS.indexOf(session.level)]} · {turns}/{MAX_ENGLISH_TURNS}</p>
      <div className="english-transcript" ref={transcript} role="log" aria-live="polite" aria-label={copy.title}>
        {session.messages.map((m, i) => <div key={i} className={`english-message is-${m.role}`}><strong>{m.role === "user" ? copy.you : copy.partner}</strong><p lang="en">{m.content}</p>{m.role === "assistant" && <button type="button" disabled={recording} onClick={() => speak(m.content)}>{copy.listen}</button>}</div>)}
      </div>
      <button className="english-audio-stop" type="button" onClick={() => window.speechSynthesis?.cancel()}>{copy.stopAudio}</button>
      {session.status === "active" && <>
        <p className="english-small">{turns >= MAX_ENGLISH_TURNS ? copy.turnLimit : copy.minTurns}</p>
        <label>{copy.draft}<textarea value={draft} disabled={disabled || turns >= MAX_ENGLISH_TURNS} maxLength={1000} onChange={e => { setDraft(e.target.value); setInputMode("text"); }} placeholder={copy.placeholder} /></label>
        <div className="english-actions">
          <button type="button" className="secondary-button" disabled={busy || readOnly || !aiEnabled || turns >= MAX_ENGLISH_TURNS} aria-pressed={recording} onClick={record}>{recording ? copy.stopMic : copy.mic}</button>
          <button type="button" className="secondary-button" disabled={disabled} onClick={() => setHint(!hint)}>{copy.hint}</button>
          <button type="button" className="primary-button" disabled={disabled || !draft.trim() || turns >= MAX_ENGLISH_TURNS} onClick={() => void act({ action: "reply", sessionId: session.id, version: session.version, text: draft, inputMode })}>{busy ? copy.busy : copy.send}</button>
        </div>
        {recording && <p role="status">{copy.recording}</p>}
        {hint && <p className="english-hint">{copy.hintNote}<br /><span lang="en">{ENGLISH_SCENARIOS[session.scenario].hint}</span></p>}
        <button type="button" className="secondary-button" disabled={disabled || turns < MIN_ENGLISH_TURNS} onClick={() => void act({ action: "finish", sessionId: session.id, version: session.version })}>{copy.finish}</button>
      </>}
      {session.feedback && <div className="english-feedback">
        <p className="eyebrow">{copy.saved}</p><h3>{copy.strength}</h3><p>{session.feedback.strength}</p>
        <h3>{copy.corrections}</h3>{session.feedback.corrections.length === 0 && <p>{copy.noCorrections}</p>}
        {session.feedback.corrections.map((c, i) => <div key={i} className="english-correction"><p lang="en">{c.original}</p><strong lang="en">→ {c.improved}</strong><p>{c.reason}</p></div>)}
        <h3>{copy.practice}</h3><p lang="en">{session.feedback.practice}</p>
        <div className="english-actions"><button type="button" className="secondary-button" onClick={() => speak(session.feedback!.practice)}>{copy.listen}</button><button type="button" className="primary-button" disabled={disabled} onClick={() => void act({ action: "start", lessonId, scenario: session.scenario, level: session.level }, session.feedback!.practice)}>{copy.again}</button></div>
      </div>}
    </>}
    {busy && <p role="status">{copy.busy}</p>}
    {error && <div role="alert" className="english-error"><p>{error}</p><button type="button" disabled={busy || recording} onClick={() => { setLoading(true); setRefresh(n => n + 1); }}>{copy.refresh}</button></div>}
    <p className="english-small">{copy.boundary}</p>
  </div>;
}
