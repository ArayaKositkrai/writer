# Architecture

Novel Studio AI แยกส่วนหลักเป็น UI, AI orchestration, storage และ export

- `src/App.tsx` ควบคุม workflow แบบง่าย 4 ขั้น
- `src/components` หน้าตั้งค่า สร้าง อ่าน ส่งออก และตั้งค่า AI
- `src/services/aiService.ts` สร้างพล็อต Story Bible โครงตอน และต้นฉบับ
- `src/services/storage.ts` จัดเก็บค่าระบบ
- `src/services/exporter.ts` ส่งออกทั้งเล่มเป็น DOCX/Markdown และสำรอง JSON
- Local Storage บันทึกโปรเจกต์อัตโนมัติ

## Typhoon content pipeline

Typhoon no longer has to return JSON for creative structured tasks. The app requests a small tagged-text template for pitches, story bible, chapter outlines, and quality reviews. `src/services/typhoonStructured.ts` parses that text and then validates the result with Zod before it enters project state.

Novel prose remains plain text. This separates creative writing from machine-readable metadata and avoids fragile JSON repair loops.
