# Novel Studio AI V2

เว็บสร้างนิยายด้วย AI แบบง่าย: เล่าไอเดีย → เลือกพล็อต → ให้ AI เขียนทั้งเล่ม → อ่าน/แก้ไข → ดาวน์โหลด DOCX

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

เปิด `http://127.0.0.1:5173`

## Build

```bash
npm run build
```

## AI configuration

ค่าทั้งหมดแยกไว้ใน `.env`

```env
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-2.5-flash
VITE_OPENAI_API_KEY=
VITE_OPENAI_MODEL=gpt-4.1-mini
VITE_OLLAMA_BASE_URL=http://127.0.0.1:11434
VITE_OLLAMA_MODEL=llama3.1:8b
```

> หมายเหตุ: `VITE_*` ถูก bundle ไปที่ frontend เหมาะกับการใช้งานในเครื่องส่วนตัว สำหรับ production ควรเรียก AI ผ่าน backend proxy

## Main flow

1. ใส่ไอเดียเรื่องในช่องใหญ่ช่องเดียว
2. AI สร้างพล็อต 3 แนวทาง พร้อม Story Bible และโครงตอน
3. เลือกพล็อตแล้วสั่งให้ AI เขียนครบทั้งเล่ม
4. อ่านและแก้ไขต้นฉบับในโหมดหนังสือ
5. ดาวน์โหลด DOCX, Markdown หรือ JSON Backup

## Structure

```text
src/
├── components/
│   ├── SetupView.tsx
│   ├── GenerateView.tsx
│   ├── ReaderView.tsx
│   ├── ExportView.tsx
│   └── SettingsView.tsx
├── services/
│   ├── aiProvider.ts
│   ├── aiService.ts
│   ├── exporter.ts
│   └── storage.ts
├── styles/app.css
├── App.tsx
└── types.ts
```

## ใช้ Typhoon API

โปรเจกต์ตั้งค่า Typhoon เป็น AI หลักสำหรับคิดพล็อต วาง Story Bible และเขียนนิยายภาษาไทยแบบต่อเนื่อง

1. สร้าง API key จาก Typhoon Playground
2. เปิดไฟล์ `.env`
3. ใส่คีย์ในตัวแปรนี้

```env
VITE_TYPHOON_API_KEY=ใส่_api_key_จริงตรงนี้
VITE_TYPHOON_BASE_URL=https://api.opentyphoon.ai/v1
VITE_TYPHOON_MODEL=typhoon-v2.1-12b-instruct
```

หลังแก้ `.env` ต้องหยุด dev server แล้วเปิดใหม่:

```bash
npm run dev
```

> หมายเหตุ: ตัวแปรที่ขึ้นต้นด้วย `VITE_` จะถูกส่งไปยัง frontend bundle จึงเหมาะกับการพัฒนาในเครื่องเท่านั้น สำหรับ production ควรเรียก Typhoon ผ่าน backend proxy เพื่อไม่เปิดเผย API key

## Typhoon output format

For Typhoon, the application uses tagged text rather than JSON when generating plot options, Story Bible data, chapter outlines, and quality reviews. This is intentional: Typhoon is more reliable at following short text templates than producing large nested JSON objects. Parsed results are still validated before saving.
