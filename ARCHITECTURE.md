<!-- ARCHITECTURE.md -->

# Architecture

## ภาพรวม

Novel Studio เป็น Single Page Application ที่ทำงานฝั่ง browser โดย React เป็นตัวควบคุม UI และ state หลัก ส่วนข้อมูลโปรเจกต์ถูกเก็บใน Local Storage

```text
User Interface
      │
      ▼
React Pages / Components
      │
      ├── Storage Service ── Local Storage
      ├── AI Service ─────── AI Provider
      └── Export Service ─── DOCX / Markdown / JSON
```

## Application Layer

- `src/App.tsx` ดูแล authentication แบบ local, active project, AI settings และ workflow navigation
- `src/pages/` เป็น route-level views
- `src/components/` เป็น feature UI และ reusable components

## Domain Model

ชนิดข้อมูลหลักอยู่ใน `src/types.ts`

- `NovelProject` ข้อมูลโปรเจกต์ทั้งหมด
- `IdeaSettings` ค่าตั้งต้นของเรื่อง
- `PitchOption` ตัวเลือก pitch
- `StoryBible` canon และข้อมูลอ้างอิงของเรื่อง
- `ChapterPlan` โครงและเนื้อหาของแต่ละตอน
- `ReviewItem` รายการตรวจคุณภาพ
- `GenerationJob` ประวัติการทำงานของ AI
- `AiSettings` provider, model และ operation mode

## AI Flow

```text
Feature Component
      │
      ▼
aiService.ts
      │
      ▼
aiProvider.ts
      ├── Gemini
      ├── OpenAI
      └── Ollama
```

`aiService.ts` สร้าง prompt และตรวจรูปแบบผลลัพธ์ ส่วน `aiProvider.ts` รับผิดชอบการเชื่อมต่อ provider, timeout, structured output และ error normalization

## Credential Flow

```text
sessionStorage key
      │ fallback
      ▼
.env key
```

ค่าจาก sessionStorage มีลำดับความสำคัญสูงกว่า `.env` เพื่อให้ผู้ใช้เปลี่ยน key ชั่วคราวได้โดยไม่ต้อง restart dev server

## Storage Flow

- Project store: `novel_studio_project_store_v1`
- AI settings: `novel_studio_ai_settings_v1`
- Session API key: `novel_studio_api_key_session_v1_<provider>`

## Export Flow

`src/services/exporter.ts` แปลงข้อมูลโปรเจกต์เป็น:

- DOCX สำหรับ Microsoft Word
- Markdown สำหรับ editor และ version control
- JSON สำหรับ backup/import

## Production Architecture ที่แนะนำ

```text
Browser
   │ HTTPS
   ▼
Application Backend
   ├── Authentication
   ├── Database
   ├── AI Proxy
   ├── Rate Limiting
   └── Audit Logs
          │
          ▼
   Gemini / OpenAI
```

ไม่ควรเก็บ production API key ในตัวแปร `VITE_*` เพราะค่าเหล่านี้อ่านได้จาก frontend bundle
