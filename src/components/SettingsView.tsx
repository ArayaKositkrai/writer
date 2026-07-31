// src/components/SettingsView.tsx

import { Cpu, RotateCcw, ShieldCheck } from 'lucide-react';
import type { AiSettings } from '../types';
import { appEnv } from '../services/env';

interface Props {
  settings: AiSettings;
  onChange: (settings: AiSettings) => void;
  defaults: AiSettings;
}

const providerModels: Record<AiSettings['provider'], string> = {
  typhoon: appEnv.typhoonModel,
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4.1-mini',
  ollama: 'qwen3:8b',
};

export default function SettingsView({ settings, onChange, defaults }: Props) {
  const changeProvider = (provider: AiSettings['provider']) => {
    onChange({
      ...settings,
      provider,
      model: providerModels[provider],
      apiKeyConfigured: provider === 'ollama' ? true : false,
    });
  };

  return (
    <div className="settings-view">
      <header className="page-intro">
        <span className="kicker"><Cpu size={15} /> AI Engine</span>
        <h1>ตั้งค่าระบบ AI</h1>
        <p>ค่าเริ่มต้นใช้ Typhoon เพื่อคิดพล็อต วางความต่อเนื่อง และแต่งนิยายภาษาไทยผ่านค่าจากไฟล์ .env</p>
      </header>

      <section className="settings-card">
        <div className="setting-row">
          <div><strong>โหมดการทำงาน</strong><span>เลือก Live API เมื่อต้องการให้ Typhoon เขียนนิยายจริง</span></div>
          <select value={settings.operationMode} onChange={(event) => onChange({ ...settings, operationMode: event.target.value as AiSettings['operationMode'] })}>
            <option value="api">Live API</option>
            <option value="mock">Mock AI</option>
          </select>
        </div>

        <div className="setting-row">
          <div><strong>AI Provider</strong><span>Typhoon เหมาะกับการคิดและเขียนภาษาไทยเป็นค่าเริ่มต้น</span></div>
          <select value={settings.provider} onChange={(event) => changeProvider(event.target.value as AiSettings['provider'])}>
            <option value="typhoon">Typhoon</option>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        <div className="setting-row">
          <div><strong>Model</strong><span>{settings.provider === 'typhoon' ? 'อ่านจาก VITE_TYPHOON_MODEL และล็อกเพื่อป้องกันค่าเก่าค้าง' : 'ชื่อโมเดลที่ส่งไปยังผู้ให้บริการ'}</span></div>
          <input
            value={settings.provider === 'typhoon' ? appEnv.typhoonModel : settings.model}
            onChange={(event) => onChange({ ...settings, model: event.target.value })}
            placeholder={providerModels[settings.provider]}
            readOnly={settings.provider === 'typhoon'}
          />
        </div>

        {settings.provider === 'typhoon' && (
          <div className="setting-row">
            <div><strong>Typhoon Base URL</strong><span>อ่านจาก VITE_TYPHOON_BASE_URL</span></div>
            <code>{appEnv.typhoonBaseUrl}</code>
          </div>
        )}
      </section>

      <div className="security-banner">
        <ShieldCheck size={21} />
        <div>
          <strong>API key อ่านจากไฟล์ .env</strong>
          <span>ตั้งค่า VITE_TYPHOON_API_KEY แล้วปิดและเปิด npm run dev ใหม่ทุกครั้งหลังแก้ .env</span>
        </div>
      </div>

      <button className="reset-settings" onClick={() => onChange(defaults)}>
        <RotateCcw size={17} />คืนค่า Typhoon เริ่มต้น
      </button>
    </div>
  );
}
