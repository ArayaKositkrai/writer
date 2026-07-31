// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TYPHOON_API_KEY?: string;
  readonly VITE_TYPHOON_BASE_URL?: string;
  readonly VITE_TYPHOON_MODEL?: string;
  readonly VITE_TYPHOON_MAX_OUTPUT_TOKENS?: string;

  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;

  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_BASE_URL?: string;
  readonly VITE_OPENAI_MODEL?: string;

  readonly VITE_OLLAMA_CHAT_URL?: string;
  readonly VITE_OLLAMA_MODEL?: string;

  readonly VITE_AI_REQUEST_TIMEOUT_MS?: string;
  readonly VITE_OLLAMA_REQUEST_TIMEOUT_MS?: string;
  readonly VITE_STORAGE_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}