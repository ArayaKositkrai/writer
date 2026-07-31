// src/services/env.ts

export const appEnv = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? '',
  openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY?.trim() ?? '',
  ollamaChatUrl:
    import.meta.env.VITE_OLLAMA_CHAT_URL?.trim() ||
    'http://localhost:11434/api/chat',
  requestTimeoutMs: Number(import.meta.env.VITE_AI_REQUEST_TIMEOUT_MS || 90_000),
  ollamaRequestTimeoutMs: Number(
    import.meta.env.VITE_OLLAMA_REQUEST_TIMEOUT_MS || 600_000,
  ),
} as const;
