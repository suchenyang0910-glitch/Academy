import { getRuntimeEnv } from "./runtime-env";

export type AiFeedbackInput = {
  lessonTitle: string;
  objective: string;
  criteria: string[];
  answer: string;
  ruleScore: number;
  ruleFeedback: string;
};

type AiRuntimeEnv = {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_MODEL?: string;
  DEEPSEEK_TIMEOUT_MS?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
};

type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const SYSTEM_PROMPT =
  "你是 Academy 学习点评教练。请只依据课程目标、检查项、规则评分和用户原始回答进行点评。" +
  "输出 JSON 对象，格式为：{\"strength\":\"一个做得好的点\",\"action\":\"一个可以立刻执行的修改\"}。" +
  "每个字段不超过60个中文字符，不要替用户重写完整答案，不要推测用户身份，不要复述可能存在的敏感信息。";

function runtimeEnv() {
  return getRuntimeEnv<AiRuntimeEnv>();
}

function timeoutMs(raw?: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 20_000;
  return Math.min(60_000, Math.max(3_000, Math.round(parsed)));
}

function normalizeFeedback(content?: string | null) {
  const raw = content?.trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      feedback?: unknown;
      strength?: unknown;
      action?: unknown;
    };
    if (typeof parsed.feedback === "string" && parsed.feedback.trim()) {
      return parsed.feedback.trim().slice(0, 320);
    }
    const strength =
      typeof parsed.strength === "string" ? parsed.strength.trim() : "";
    const action = typeof parsed.action === "string" ? parsed.action.trim() : "";
    if (strength || action) {
      return [
        strength ? `做得好：${strength}` : "",
        action ? `下一步：${action}` : "",
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 320);
    }
  } catch {
    // Some compatible endpoints may ignore JSON mode. A short plain-text
    // response is still useful and safe to display.
  }

  return raw.slice(0, 320);
}

async function requestDeepSeekFeedback(
  input: AiFeedbackInput,
  config: AiRuntimeEnv,
) {
  if (!config.DEEPSEEK_API_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs(config.DEEPSEEK_TIMEOUT_MS),
  );
  try {
    const baseUrl = (
      config.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
    ).replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(input) },
        ],
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        temperature: 0.2,
        max_tokens: 300,
        stream: false,
      }),
    });
    if (!response.ok) {
      console.warn("DeepSeek feedback unavailable", {
        status: response.status,
      });
      return null;
    }
    const payload = (await response.json()) as ChatCompletionPayload;
    return normalizeFeedback(payload.choices?.[0]?.message?.content);
  } catch (error) {
    console.warn("DeepSeek feedback request failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function requestOllamaFeedback(
  input: AiFeedbackInput,
  config: AiRuntimeEnv,
) {
  if (!config.OLLAMA_BASE_URL) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      `${config.OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: config.OLLAMA_MODEL ?? "deepseek-r1:7b",
          stream: false,
          format: "json",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(input) },
          ],
        }),
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      message?: { content?: string };
    };
    return normalizeFeedback(payload.message?.content);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestAiFeedback(input: AiFeedbackInput) {
  const config = runtimeEnv();
  const deepSeekFeedback = await requestDeepSeekFeedback(input, config);
  if (deepSeekFeedback) return deepSeekFeedback;
  return requestOllamaFeedback(input, config);
}

export function getAiRuntimeStatus() {
  const config = runtimeEnv();
  return {
    enabled: Boolean(config.DEEPSEEK_API_KEY || config.OLLAMA_BASE_URL),
    primary: config.DEEPSEEK_API_KEY
      ? ("deepseek" as const)
      : config.OLLAMA_BASE_URL
        ? ("ollama" as const)
        : ("rules_only" as const),
    model: config.DEEPSEEK_API_KEY
      ? config.DEEPSEEK_MODEL ?? "deepseek-v4-flash"
      : config.OLLAMA_MODEL ?? null,
    fallbackEnabled: Boolean(
      config.DEEPSEEK_API_KEY && config.OLLAMA_BASE_URL,
    ),
  };
}
