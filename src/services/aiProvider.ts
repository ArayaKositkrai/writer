// src/services/aiProvider.ts

import { z } from 'zod';
import { AiSettings } from '../types';
import { getApiKey } from './credentials';
import { appEnv } from './env';

const REQUEST_TIMEOUT_MS = appEnv.requestTimeoutMs;
const OLLAMA_REQUEST_TIMEOUT_MS = appEnv.ollamaRequestTimeoutMs;
const OLLAMA_CHAT_URL = appEnv.ollamaChatUrl;

export interface GenerateTextOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

function outputTokenLimit(options?: GenerateTextOptions) {
  return Math.min(16_000, Math.max(512, Math.round(options?.maxOutputTokens ?? 16_000)));
}

export class AiProviderError extends Error {
  constructor(message: string, readonly code: 'missing_key' | 'auth' | 'rate_limit' | 'timeout' | 'invalid_response' | 'request_failed') {
    super(message);
    this.name = 'AiProviderError';
  }
}

function controllerWithTimeout(timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => window.clearTimeout(timeout) };
}

function requireKey(settings: AiSettings) {
  const key = getApiKey(settings.provider);
  if (!key) {
    const providerName = settings.provider === 'openai' ? 'OpenAI' : 'Google AI';
    throw new AiProviderError(`ยังไม่ได้กรอก API key สำหรับ ${providerName}`, 'missing_key');
  }
  return key;
}

function normalizeProviderError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AiProviderError('AI ใช้เวลาตอบนานเกิน 90 วินาที กรุณาลองใหม่', 'timeout');
  }

  const candidate = error as { status?: number; code?: string; message?: string; name?: string };
  const safeDetail = (candidate?.message ?? '')
    .replace(/AIza[\w-]+/g, '[API key ถูกซ่อน]')
    .replace(/sk-[\w-]+/g, '[API key ถูกซ่อน]')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
  if (candidate?.status === 401 || candidate?.status === 403 || /API_KEY_INVALID|API key not valid|invalid api key/i.test(safeDetail)) {
    return new AiProviderError('API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้โมเดลนี้', 'auth');
  }
  if (candidate?.status === 429 || candidate?.code === 'rate_limit_exceeded') {
    return new AiProviderError('เกินโควตาหรืออัตราการเรียก API กรุณารอสักครู่แล้วลองใหม่', 'rate_limit');
  }
  if (candidate?.name === 'AbortError') {
    return new AiProviderError('AI ใช้เวลาตอบนานเกิน 90 วินาที กรุณาลองใหม่', 'timeout');
  }
  if (candidate?.status === 400) {
    return new AiProviderError(`Provider ปฏิเสธรูปแบบคำขอ (400)${safeDetail ? `: ${safeDetail}` : ''}`, 'request_failed');
  }
  return new AiProviderError('เรียก AI ไม่สำเร็จ กรุณาตรวจสอบ key, model และการเชื่อมต่ออินเทอร์เน็ต', 'request_failed');
}

function geminiJsonSchema(schema: z.ZodType) {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
}

function parseJsonResponse(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as unknown;
}

interface OllamaChatResponse {
  message?: { content?: string };
  error?: string;
}

async function ollamaChat(settings: AiSettings, system: string, prompt: string, format?: Record<string, unknown>, generation: GenerateTextOptions = {}) {
  const { controller, clear } = controllerWithTimeout(OLLAMA_REQUEST_TIMEOUT_MS);
  const maxOutputTokens = outputTokenLimit(generation);
  try {
    const response = await fetch(OLLAMA_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: settings.model,
        stream: false,
        think: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        ...(format ? { format } : {}),
        options: {
          num_predict: maxOutputTokens,
          num_ctx: Math.min(32_768, Math.max(8_192, maxOutputTokens + Math.ceil(prompt.length / 2))),
          temperature: format ? 0 : generation.temperature ?? 0.8,
          top_p: 0.95,
          top_k: 64,
        },
      }),
    });

    const data = await response.json().catch(() => ({})) as OllamaChatResponse;
    if (!response.ok) {
      if (response.status === 404) {
        throw new AiProviderError(`ไม่พบโมเดล ${settings.model} ใน Ollama กรุณารัน: ollama pull ${settings.model}`, 'request_failed');
      }
      const error = Object.assign(new Error(data.error || `Ollama HTTP ${response.status}`), { status: response.status });
      throw error;
    }

    const text = data.message?.content?.trim();
    if (!text) throw new AiProviderError('Ollama ไม่ส่งเนื้อหากลับมา', 'invalid_response');
    return text;
  } catch (error) {
    const candidate = error as { name?: string };
    if ((error instanceof DOMException && error.name === 'AbortError') || candidate?.name === 'AbortError') {
      throw new AiProviderError('Ollama ใช้เวลาตอบนานเกิน 10 นาที กรุณาลองใหม่หรือเลือกโมเดลที่เล็กลง', 'timeout');
    }
    if (error instanceof TypeError) {
      throw new AiProviderError('เชื่อมต่อ Ollama ไม่ได้ กรุณาเปิด Ollama ที่ localhost:11434 และตรวจสอบ CORS', 'request_failed');
    }
    throw normalizeProviderError(error);
  } finally {
    clear();
  }
}

async function ollamaText(settings: AiSettings, system: string, prompt: string, options?: GenerateTextOptions) {
  return ollamaChat(settings, system, prompt, undefined, options);
}

async function ollamaStructured<T>(settings: AiSettings, system: string, prompt: string, schema: z.ZodType<T>) {
  const format = geminiJsonSchema(schema);
  const structuredPrompt = `${prompt}\n\nตอบเป็น JSON เท่านั้นตาม schema นี้:\n${JSON.stringify(format)}`;
  const raw = await ollamaChat(settings, system, structuredPrompt, format);
  try {
    const parsed = schema.safeParse(parseJsonResponse(raw));
    if (!parsed.success) throw new AiProviderError('ผลลัพธ์จาก Ollama ไม่ตรงกับรูปแบบข้อมูลที่ระบบต้องการ', 'invalid_response');
    return parsed.data;
  } catch (error) {
    if (error instanceof SyntaxError) throw new AiProviderError('Ollama ส่ง JSON ที่อ่านไม่ได้ กรุณาลองใหม่', 'invalid_response');
    throw error;
  }
}

async function openAiText(settings: AiSettings, system: string, prompt: string, options?: GenerateTextOptions) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: requireKey(settings), dangerouslyAllowBrowser: true });
  const { controller, clear } = controllerWithTimeout();
  try {
    const response = await client.responses.create({
      model: settings.model,
      instructions: system,
      input: prompt,
      max_output_tokens: outputTokenLimit(options),
    }, { signal: controller.signal });
    const text = response.output_text?.trim();
    if (!text) throw new AiProviderError('AI ไม่ส่งเนื้อหากลับมา', 'invalid_response');
    return text;
  } catch (error) {
    throw normalizeProviderError(error);
  } finally {
    clear();
  }
}

async function openAiStructured<T>(settings: AiSettings, system: string, prompt: string, schema: z.ZodType<T>, schemaName: string) {
  const [{ default: OpenAI }, { zodTextFormat }] = await Promise.all([
    import('openai'),
    import('openai/helpers/zod'),
  ]);
  const client = new OpenAI({ apiKey: requireKey(settings), dangerouslyAllowBrowser: true });
  const { controller, clear } = controllerWithTimeout();
  try {
    const response = await client.responses.parse({
      model: settings.model,
      instructions: system,
      input: prompt,
      max_output_tokens: 16_000,
      text: { format: zodTextFormat(schema, schemaName) },
    }, { signal: controller.signal });
    if (!response.output_parsed) throw new AiProviderError('ผลลัพธ์จาก AI ไม่ตรงกับรูปแบบข้อมูลที่ระบบต้องการ', 'invalid_response');
    return response.output_parsed;
  } catch (error) {
    throw normalizeProviderError(error);
  } finally {
    clear();
  }
}

async function geminiText(settings: AiSettings, system: string, prompt: string, options?: GenerateTextOptions) {
  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: requireKey(settings) });
  const { controller, clear } = controllerWithTimeout();
  try {
    const response = await client.models.generateContent({
      model: settings.model,
      contents: prompt,
      config: {
        systemInstruction: system,
        maxOutputTokens: outputTokenLimit(options),
        temperature: options?.temperature,
        abortSignal: controller.signal,
      },
    });
    const text = response.text?.trim();
    if (!text) throw new AiProviderError('AI ไม่ส่งเนื้อหากลับมา', 'invalid_response');
    return text;
  } catch (error) {
    throw normalizeProviderError(error);
  } finally {
    clear();
  }
}

async function geminiStructured<T>(settings: AiSettings, system: string, prompt: string, schema: z.ZodType<T>) {
  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: requireKey(settings) });
  const { controller, clear } = controllerWithTimeout();
  try {
    const response = await client.models.generateContent({
      model: settings.model,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseJsonSchema: geminiJsonSchema(schema),
        maxOutputTokens: 16_384,
        abortSignal: controller.signal,
      },
    });
    const raw = response.text?.trim();
    if (!raw) throw new AiProviderError('AI ไม่ส่งข้อมูลกลับมา', 'invalid_response');
    const parsed = schema.safeParse(parseJsonResponse(raw));
    if (!parsed.success) throw new AiProviderError('ผลลัพธ์จาก AI ไม่ตรงกับรูปแบบข้อมูลที่ระบบต้องการ', 'invalid_response');
    return parsed.data;
  } catch (error) {
    if (error instanceof SyntaxError) throw new AiProviderError('AI ส่ง JSON ที่อ่านไม่ได้ กรุณาลองใหม่', 'invalid_response');
    throw normalizeProviderError(error);
  } finally {
    clear();
  }
}

export async function generateText(settings: AiSettings, system: string, prompt: string, options?: GenerateTextOptions) {
  if (settings.provider === 'openai') return openAiText(settings, system, prompt, options);
  if (settings.provider === 'ollama') return ollamaText(settings, system, prompt, options);
  return geminiText(settings, system, prompt, options);
}

export async function generateStructured<T>(settings: AiSettings, system: string, prompt: string, schema: z.ZodType<T>, schemaName: string) {
  if (settings.provider === 'openai') return openAiStructured(settings, system, prompt, schema, schemaName);
  if (settings.provider === 'ollama') return ollamaStructured(settings, system, prompt, schema);
  return geminiStructured(settings, system, prompt, schema);
}
