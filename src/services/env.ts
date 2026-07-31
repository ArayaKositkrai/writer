// src/services/env.ts

function readEnv(name: string, fallback = ""): string {
  const rawValue = import.meta.env[name] as string | undefined;
  return rawValue?.trim() || fallback;
}

function readNumberEnv(name: string, fallback: number): number {
  const rawValue = readEnv(name);

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

const typhoonApiKey = readEnv("VITE_TYPHOON_API_KEY");
const typhoonBaseUrl = readEnv(
  "VITE_TYPHOON_BASE_URL",
  "https://api.opentyphoon.ai/v1",
);
const typhoonModel = readEnv("VITE_TYPHOON_MODEL");
const typhoonMaxOutputTokens = readNumberEnv(
  "VITE_TYPHOON_MAX_OUTPUT_TOKENS",
  4096,
);

const geminiApiKey = readEnv("VITE_GEMINI_API_KEY");
const geminiModel = readEnv(
  "VITE_GEMINI_MODEL",
  "gemini-2.5-flash",
);

const openAiApiKey = readEnv("VITE_OPENAI_API_KEY");
const openAiBaseUrl = readEnv(
  "VITE_OPENAI_BASE_URL",
  "https://api.openai.com/v1",
);
const openAiModel = readEnv(
  "VITE_OPENAI_MODEL",
  "gpt-4.1-mini",
);

const ollamaChatUrl = readEnv(
  "VITE_OLLAMA_CHAT_URL",
  "http://localhost:11434/api/chat",
);
const ollamaModel = readEnv(
  "VITE_OLLAMA_MODEL",
  "llama3.1:8b",
);

const requestTimeoutMs = readNumberEnv(
  "VITE_AI_REQUEST_TIMEOUT_MS",
  180_000,
);
const ollamaRequestTimeoutMs = readNumberEnv(
  "VITE_OLLAMA_REQUEST_TIMEOUT_MS",
  600_000,
);
const storagePrefix = readEnv(
  "VITE_STORAGE_PREFIX",
  "novel_studio_ai_v2",
);

export const appEnv = {
  // โครงสร้างใหม่แบบจัดกลุ่ม
  typhoon: {
    apiKey: typhoonApiKey,
    baseUrl: typhoonBaseUrl,
    model: typhoonModel,
    maxOutputTokens: typhoonMaxOutputTokens,
  },

  gemini: {
    apiKey: geminiApiKey,
    model: geminiModel,
  },

  openai: {
    apiKey: openAiApiKey,
    baseUrl: openAiBaseUrl,
    model: openAiModel,
  },

  ollama: {
    chatUrl: ollamaChatUrl,
    model: ollamaModel,
  },

  requestTimeoutMs,
  ollamaRequestTimeoutMs,
  storagePrefix,

  // Compatibility aliases สำหรับโค้ดเดิม
  typhoonApiKey,
  typhoonBaseUrl,
  typhoonModel,
  typhoonMaxOutputTokens,

  geminiApiKey,
  geminiModel,

  openAiApiKey,
  openAiBaseUrl,
  openAiModel,

  ollamaChatUrl,
  ollamaModel,
} as const;

export function validateTyphoonEnv(): void {
  if (!appEnv.typhoonApiKey) {
    throw new Error(
      "ไม่พบ VITE_TYPHOON_API_KEY กรุณาเพิ่ม API key ในไฟล์ .env",
    );
  }

  if (!appEnv.typhoonModel) {
    throw new Error(
      "ไม่พบ VITE_TYPHOON_MODEL กรุณาระบุ Model ID ในไฟล์ .env",
    );
  }

  if (!appEnv.typhoonBaseUrl) {
    throw new Error(
      "ไม่พบ VITE_TYPHOON_BASE_URL กรุณาตั้งค่าในไฟล์ .env",
    );
  }
}