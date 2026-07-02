import { z } from 'zod';
import { AiSettings } from '../types';
import { getApiKey } from './credentials';

const REQUEST_TIMEOUT_MS = 90_000;

export class AiProviderError extends Error {
  constructor(message: string, readonly code: 'missing_key' | 'auth' | 'rate_limit' | 'timeout' | 'invalid_response' | 'request_failed') {
    super(message);
    this.name = 'AiProviderError';
  }
}

function controllerWithTimeout() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return { controller, clear: () => window.clearTimeout(timeout) };
}

function requireKey(settings: AiSettings) {
  const key = getApiKey(settings.provider);
  if (!key) {
    throw new AiProviderError(`ยังไม่ได้กรอก API key สำหรับ ${settings.provider === 'openai' ? 'OpenAI' : 'Gemini'}`, 'missing_key');
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

async function openAiText(settings: AiSettings, system: string, prompt: string) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: requireKey(settings), dangerouslyAllowBrowser: true });
  const { controller, clear } = controllerWithTimeout();
  try {
    const response = await client.responses.create({
      model: settings.model,
      instructions: system,
      input: prompt,
      max_output_tokens: 16_000,
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

async function geminiText(settings: AiSettings, system: string, prompt: string) {
  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: requireKey(settings) });
  const { controller, clear } = controllerWithTimeout();
  try {
    const response = await client.models.generateContent({
      model: settings.model,
      contents: prompt,
      config: { systemInstruction: system, maxOutputTokens: 16_000, abortSignal: controller.signal },
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
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new AiProviderError('ผลลัพธ์จาก AI ไม่ตรงกับรูปแบบข้อมูลที่ระบบต้องการ', 'invalid_response');
    return parsed.data;
  } catch (error) {
    if (error instanceof SyntaxError) throw new AiProviderError('AI ส่ง JSON ที่อ่านไม่ได้ กรุณาลองใหม่', 'invalid_response');
    throw normalizeProviderError(error);
  } finally {
    clear();
  }
}

export async function generateText(settings: AiSettings, system: string, prompt: string) {
  return settings.provider === 'openai'
    ? openAiText(settings, system, prompt)
    : geminiText(settings, system, prompt);
}

export async function generateStructured<T>(settings: AiSettings, system: string, prompt: string, schema: z.ZodType<T>, schemaName: string) {
  return settings.provider === 'openai'
    ? openAiStructured(settings, system, prompt, schema, schemaName)
    : geminiStructured(settings, system, prompt, schema);
}
