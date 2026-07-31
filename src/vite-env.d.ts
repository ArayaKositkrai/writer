// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OLLAMA_CHAT_URL?: string;
  readonly VITE_AI_REQUEST_TIMEOUT_MS?: string;
  readonly VITE_OLLAMA_REQUEST_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
