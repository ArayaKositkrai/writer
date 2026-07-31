// src/components/sidebar-config.ts

import { AiSettings } from '../types';

export interface ModelOption {
  value: string;
  label: string;
  description: string;
}

export const providerDescriptions: Record<AiSettings['provider'], string> = {
  gemini: 'Cloud ของ Google · เร็วและรองรับ structured output เหมาะกับทุก Step · ต้องใช้ API key',
  openai: 'Cloud ของ OpenAI · เด่นด้านคุณภาพการเขียนและแก้ไข · ต้องใช้ API key',
  ollama: 'รันในเครื่องผ่าน localhost · ข้อมูลไม่ออกจากเครื่อง · ความเร็วขึ้นกับ RAM/GPU',
};

export const providerModelOptions: Record<AiSettings['provider'], ModelOption[]> = {
  gemini: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (แนะนำ)', description: 'เร็วและสมดุล: Pitch, Story Bible, โครงตอน, เขียนร่าง และ Review' },
    { value: 'gemma-4-26b-a4b-it', label: 'Gemma 4 26B A4B', description: 'งานเขียนยาวและเหตุผลซับซ้อน; ใช้เวลามากกว่า Flash' },
    { value: 'gemma-4-31b-it', label: 'Gemma 4 31B', description: 'เน้นคุณภาพต้นฉบับและการวางเหตุผล; ช้ากว่า 26B' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'เหมาะกับ Story Bible ซับซ้อนและ Quality Review แบบละเอียด' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', description: 'ประหยัดและเร็ว เหมาะกับ Pitch/Review; คุณภาพงานยาวอาจลดลง' },
  ],
  openai: [
    { value: 'gpt-5.4-mini', label: 'GPT-5.4 mini (แนะนำ)', description: 'สมดุลคุณภาพ/ความเร็ว ใช้ได้ดีกับทุก Step' },
    { value: 'gpt-5.5', label: 'GPT-5.5 (คุณภาพสูง)', description: 'เหมาะกับโครงเรื่องซับซ้อน ต้นฉบับคุณภาพสูง และรีไรต์' },
    { value: 'gpt-5.4-nano', label: 'GPT-5.4 nano (ประหยัด)', description: 'เหมาะกับ Pitch หรือ Review สั้นๆ; ไม่แนะนำสำหรับต้นฉบับยาว' },
  ],
  ollama: [
    { value: 'gemma4:e4b', label: 'Gemma 4 E4B (เร็วสุด / แนะนำ)', description: 'เหมาะกับ Pitch, โครงตอน และ Review; เร็วสุดสำหรับเครื่องทั่วไป' },
    { value: 'gemma4:12b', label: 'Gemma 4 12B (สมดุล)', description: 'เหมาะกับ Story Bible และต้นฉบับ เมื่อมี RAM/GPU เพียงพอ' },
    { value: 'gemma4:26b', label: 'Gemma 4 26B A4B (คุณภาพสูง / ช้า)', description: 'เน้นต้นฉบับและเหตุผล; ไม่เหมาะถ้าต้องการความเร็ว' },
    { value: 'gemma4:31b', label: 'Gemma 4 31B (ช้าที่สุด)', description: 'คุณภาพสูงสุดในกลุ่ม Local; ต้องใช้ทรัพยากรสูงมาก' },
  ],
};

export const defaultModel: Record<AiSettings['provider'], string> = {
  gemini: 'gemini-3.5-flash',
  openai: 'gpt-5.4-mini',
  ollama: 'gemma4:e4b',
};

export const operationModeDescriptions: Record<AiSettings['operationMode'], string> = {
  mock: 'Mock AI: ทดลองใช้งานด้วยข้อมูลจำลอง ไม่เรียก API จริง',
  manual: 'Manual Prompt: ให้ระบบช่วยจัด prompt แล้วคนเขียนนำไปใช้เอง',
  api: 'Live API: เรียกโมเดลจริงผ่าน API สำหรับผลลัพธ์จริง',
};
