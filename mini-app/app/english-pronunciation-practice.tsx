"use client";

import { useEffect, useRef, useState } from "react";
import { alignTranscriptToPhrase, type PronunciationAlignment } from "../lib/pronunciation-alignment";
import type { AppLocale } from "../lib/i18n";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type Copy = {
  open: string; close: string; listen: string; start: string; stop: string;
  title: string; intro: string; privacy: string; unsupported: string; failed: string;
  heard: string; coverage: string; missing: string; retry: string; noMissing: string;
};

const copyByLocale: Record<AppLocale, Copy> = {
  "zh-Hans": {
    open: "跟读这句话", close: "收起跟读", listen: "先听示范", start: "开始跟读", stop: "停止识别",
    title: "跟读校对", intro: "听一句，再说一句。系统只核对转写是否覆盖目标词，不给发音分数。",
    privacy: "录音由浏览器语音识别处理，不上传或保存到 Academy。转写不等于真实发音质量。",
    unsupported: "当前 Telegram 浏览器不支持语音识别，请先听示范并自行跟读。", failed: "没有识别到清晰语音，请确认麦克风权限后重试。",
    heard: "系统听到", coverage: "目标词覆盖", missing: "建议再练", retry: "再跟读一次", noMissing: "目标词都被识别到了。接着听一遍，再自然地说一次。",
  },
  vi: {
    open: "Nhắc lại câu này", close: "Thu gọn", listen: "Nghe mẫu", start: "Bắt đầu nói", stop: "Dừng nhận dạng",
    title: "Đối chiếu câu nói", intro: "Nghe một câu rồi lặp lại. Hệ thống chỉ đối chiếu từ được nhận dạng, không chấm phát âm.",
    privacy: "Nhận dạng do trình duyệt xử lý; Academy không tải lên hoặc lưu bản ghi. Bản chép không phải chất lượng phát âm.",
    unsupported: "Telegram trên thiết bị này không hỗ trợ nhận dạng giọng nói. Hãy nghe mẫu và tự luyện.", failed: "Không nhận được giọng nói rõ ràng. Hãy kiểm tra quyền micro rồi thử lại.",
    heard: "Hệ thống nghe", coverage: "Từ mục tiêu", missing: "Nên luyện lại", retry: "Nói lại", noMissing: "Tất cả từ mục tiêu đã được nhận dạng. Hãy nghe lại và nói tự nhiên thêm một lần.",
  },
  km: {
    open: "និយាយតាមប្រយោគនេះ", close: "បិទ", listen: "ស្ដាប់គំរូ", start: "ចាប់ផ្ដើមនិយាយ", stop: "បញ្ឈប់ការស្គាល់",
    title: "ផ្ទៀងផ្ទាត់ការនិយាយ", intro: "ស្ដាប់មួយប្រយោគ រួចនិយាយតាម។ ប្រព័ន្ធផ្ទៀងផ្ទាត់តែពាក្យដែលស្គាល់ មិនដាក់ពិន្ទុការបញ្ចេញសំឡេងទេ។",
    privacy: "ការស្គាល់សំឡេងដំណើរការក្នុងកម្មវិធីរុករក; Academy មិនផ្ទុកឡើង ឬរក្សាទុកសំឡេងទេ។ អក្សរដែលស្គាល់មិនមែនជាគុណភាពបញ្ចេញសំឡេងពិតទេ។",
    unsupported: "Telegram លើឧបករណ៍នេះមិនគាំទ្រការស្គាល់សំឡេងទេ។ សូមស្ដាប់គំរូ ហើយហាត់ដោយខ្លួនឯង។", failed: "មិនអាចស្គាល់សំឡេងច្បាស់ទេ។ ពិនិត្យសិទ្ធិមីក្រូហ្វូន រួចព្យាយាមម្ដងទៀត។",
    heard: "ប្រព័ន្ធឮ", coverage: "ពាក្យគោលដៅ", missing: "គួរហាត់ម្ដងទៀត", retry: "និយាយម្ដងទៀត", noMissing: "ពាក្យគោលដៅទាំងអស់ត្រូវបានស្គាល់។ ស្ដាប់ម្ដងទៀត ហើយនិយាយឲ្យធម្មជាតិ។",
  },
  th: {
    open: "พูดตามประโยคนี้", close: "ย่อ", listen: "ฟังตัวอย่าง", start: "เริ่มพูด", stop: "หยุดการรู้จำ",
    title: "ตรวจคำที่พูด", intro: "ฟังหนึ่งประโยคแล้วพูดตาม ระบบตรวจเฉพาะคำที่ถอดเสียงได้ ไม่ให้คะแนนการออกเสียง",
    privacy: "การรู้จำเสียงทำงานผ่านเบราว์เซอร์ Academy ไม่อัปโหลดหรือเก็บไฟล์เสียง ข้อความถอดเสียงไม่ใช่คุณภาพการออกเสียงจริง",
    unsupported: "Telegram บนอุปกรณ์นี้ไม่รองรับการรู้จำเสียง โปรดฟังตัวอย่างและฝึกด้วยตนเอง", failed: "ไม่พบเสียงที่ชัดเจน ตรวจสิทธิ์ไมโครโฟนแล้วลองอีกครั้ง",
    heard: "ระบบได้ยิน", coverage: "คำเป้าหมาย", missing: "ควรฝึกอีกครั้ง", retry: "พูดอีกครั้ง", noMissing: "ระบบรู้จำคำเป้าหมายได้ครบ ฟังอีกครั้งแล้วพูดให้เป็นธรรมชาติ",
  },
};

export function EnglishPronunciationPractice({ phrase, locale }: { phrase: string; locale: AppLocale }) {
  const copy = copyByLocale[locale];
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<PronunciationAlignment | null>(null);
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    recognition.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    window.speechSynthesis?.cancel();
  }, []);

  function play() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function record() {
    if (recording) { recognition.current?.stop(); return; }
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor || !window.isSecureContext) { setError(copy.unsupported); return; }
    setError(""); setResult(null); window.speechSynthesis?.cancel();
    const next = new Constructor(); recognition.current = next;
    next.lang = "en-US"; next.continuous = false; next.interimResults = false;
    next.onresult = (event) => {
      const transcript = Array.from(event.results).map((item) => item[0]?.transcript ?? "").join(" ").trim();
      if (transcript) setResult(alignTranscriptToPhrase(phrase, transcript));
      else setError(copy.failed);
    };
    next.onerror = () => setError(copy.failed);
    next.onend = () => { setRecording(false); if (timer.current) clearTimeout(timer.current); };
    try { next.start(); setRecording(true); timer.current = setTimeout(() => next.stop(), 20_000); }
    catch { setRecording(false); setError(copy.failed); }
  }

  return <section className="pronunciation-practice" aria-label={copy.title}>
    <button type="button" className="secondary-button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? copy.close : copy.open}</button>
    {open && <div className="pronunciation-workspace">
      <h4>{copy.title}</h4><p lang="en" className="pronunciation-phrase">{phrase}</p><p className="english-small">{copy.intro}</p>
      <div className="english-actions"><button type="button" className="secondary-button" onClick={play}>{copy.listen}</button><button type="button" className="primary-button" aria-pressed={recording} onClick={record}>{recording ? copy.stop : copy.start}</button></div>
      {recording && <p role="status">…</p>}
      {result && <div className="pronunciation-result"><p><strong>{copy.heard}:</strong> <span lang="en">{result.heardWords.join(" ") || "—"}</span></p><p><strong>{copy.coverage}:</strong> {result.coveragePercent}%</p>{result.missingWords.length > 0 ? <p><strong>{copy.missing}:</strong> <span lang="en">{result.missingWords.join(", ")}</span></p> : <p>{copy.noMissing}</p>}<button type="button" className="secondary-button" onClick={record}>{copy.retry}</button></div>}
      {error && <p className="english-error" role="alert">{error}</p>}<p className="english-small">{copy.privacy}</p>
    </div>}
  </section>;
}
