<!-- README.md -->

# Novel Studio

Novel Studio คือเว็บแอปสำหรับวางแผน เขียน ตรวจทาน และส่งออกนิยายด้วย workflow แบบเป็นขั้นตอน ตั้งแต่ไอเดียเริ่มต้นไปจนถึงต้นฉบับพร้อมใช้งาน

## ฟีเจอร์หลัก

- Idea Base สำหรับกำหนดแนวเรื่อง กลุ่มผู้อ่าน โทน และจำนวนตอน
- Pitch Lab สำหรับสร้างและเลือกแนวทางของเรื่อง
- Story Bible สำหรับเก็บกฎโลก ตัวละคร เส้นเวลา ปม และ canon
- Chapter Board สำหรับวางโครงตอนและติดตามสถานะ
- Chapter Writer พร้อม Rich Text Editor และเครื่องมือ AI
- Quality Review สำหรับตรวจ continuity, logic, character, style, pacing และ hook
- Export เป็น DOCX, Markdown และ JSON
- รองรับ Gemini, OpenAI และ Ollama Local
- เก็บโปรเจกต์ใน Local Storage และนำเข้าไฟล์สำรองกลับมาได้

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Google GenAI SDK
- OpenAI SDK
- Zod
- DOCX
- Lucide React

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env
npm run dev
```

เปิดเว็บที่:

```text
http://127.0.0.1:5173
```

## ตั้งค่า Environment Variables

ค่าการเชื่อมต่อ AI ถูกแยกไว้ใน `.env`

```env
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
VITE_OLLAMA_CHAT_URL=http://localhost:11434/api/chat
VITE_AI_REQUEST_TIMEOUT_MS=90000
VITE_OLLAMA_REQUEST_TIMEOUT_MS=600000
```

ระบบจะเลือก API key ตามลำดับนี้:

1. Key ที่ผู้ใช้กรอกในหน้าตั้งค่า AI ของแท็บปัจจุบัน
2. Key จากไฟล์ `.env`

> ตัวแปรที่ขึ้นต้นด้วย `VITE_` จะถูกนำไปใช้ใน frontend bundle จึงเหมาะกับการพัฒนาในเครื่องหรือระบบส่วนตัวเท่านั้น สำหรับ production ควรย้ายการเรียก Gemini/OpenAI ไป backend proxy เพื่อไม่ให้ key ปรากฏใน browser

## ใช้งาน Ollama

```bash
ollama pull gemma4:e4b
ollama serve
```

จากนั้นเลือก:

```text
Provider: Ollama (Local)
Operation Mode: Live API
```

ค่าเริ่มต้นของ Ollama endpoint คือ:

```text
http://localhost:11434/api/chat
```

## โครงสร้างโปรเจกต์

```text
src/
├── components/          UI components และ feature panels
├── data/                ค่าเริ่มต้นและ presets
├── pages/               หน้าหลักของแต่ละ workflow
├── services/            AI, credentials, storage, export และ rich text
├── App.tsx              application shell และ state orchestration
├── routes.ts            route definitions
├── types.ts             shared domain types
└── styles.css           global styles
```

## Workflow

```text
Idea → Pitch → Story Bible → Chapter Board → Writer → Export
```

ข้อมูลทั้งหมดของโปรเจกต์อยู่ใน `NovelProject` และถูกบันทึกลง Local Storage ผ่าน `src/services/storage.ts`

## การตรวจสอบ Build

```bash
npm run build
npm run preview
```

## เอกสารสำหรับพัฒนาต่อ

- `ARCHITECTURE.md` โครงสร้างและการไหลของระบบ
- `FEATURES.md` รายละเอียดฟีเจอร์
- `PROJECT_PROGRESS.md` สถานะล่าสุดของโปรเจกต์
- `BUGS.md` ปัญหาและความเสี่ยงที่ควรแก้
- `ROADMAP.md` ลำดับการพัฒนาต่อ
- `CHANGELOG.md` ประวัติการเปลี่ยนแปลง
