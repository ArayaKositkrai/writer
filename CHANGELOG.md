
## 2026-08-01 — Typhoon model and settings migration fix

- ใช้ `VITE_TYPHOON_MODEL` เป็นแหล่งข้อมูลหลักเพียงจุดเดียวสำหรับ Typhoon
- บังคับย้ายค่าโมเดล Typhoon เก่าที่ค้างใน `localStorage` อัตโนมัติ
- ล็อกช่อง Model ของ Typhoon ในหน้าตั้งค่าเพื่อป้องกันค่าเก่าทับ `.env`
- ปรับ Typhoon request ให้ใช้เฉพาะพารามิเตอร์ OpenAI-compatible มาตรฐาน
- แสดงรายละเอียด `detail` จาก Typhoon API เมื่อคำขอผิดพลาด
- อัปเดต `.env.example` เป็น `typhoon-v2.5-30b-a3b-instruct`
- ล้าง API key ที่ถูกเปิดเผยออกจากไฟล์ส่งมอบ
# Changelog

## 2.0.0 - 2026-07-31

- Rebuilt the entire application shell and user experience.
- Replaced the long dashboard form with a one-prompt story composer.
- Added visual plot selection and horizontal chapter outline.
- Added book-style reader with chapter editing.
- Added one-click full-book DOCX export and backup formats.
- Preserved Gemini, OpenAI, Ollama, Mock AI, local storage, and export logic.
- Added responsive desktop, tablet, and mobile layouts.

## 2026-08-01 — Typhoon non-JSON structured pipeline

- เลิกบังคับ Typhoon ให้สร้าง JSON สำหรับพล็อต, Story Bible, โครงตอน และ Quality Review
- เปลี่ยนเป็น tagged text template ที่อ่านง่ายและ parse ได้แน่นอนกว่า
- เพิ่ม parser แยกสำหรับ pitch, story bible, chapter outline และ review
- ยังคง Zod validation หลัง parse เพื่อป้องกันข้อมูลไม่ครบ
- งานเขียนเนื้อหานิยายยังใช้ข้อความธรรมดาเหมือนเดิม

## 2026-08-01 — Typhoon Sequential Novel Pipeline

- แยกการสร้างนิยายเป็นหลาย API calls: แกนเรื่อง, ตัวละคร, timeline/puzzles และโครงตอนทีละ 3 ตอน
- ลดความเสี่ยง token ล้นและคำตอบขาดกลางทาง
- เพิ่ม parser แบบยืดหยุ่นพร้อม fallback เฉพาะส่วน เพื่อไม่ให้ทั้งกระบวนการล้มเพราะหัวข้อเดียวขาด
- โครงตอนแต่ละ batch รับผลลัพธ์ตอนก่อนหน้าเพื่อรักษาความต่อเนื่อง
- Typhoon ไม่ต้องสร้าง Story Bible และทุกตอนในคำขอเดียวอีกต่อไป

## 2026-08-01 — Chapter Opening Diversity & Continuity Fix

- Removed the repeated hard-coded chapter opening from the fallback writer.
- Added 12 rotating opening strategies so adjacent chapters start with different narrative devices.
- Live AI chapter prompts now include the previous chapter ending, two recent chapter summaries, canon, unresolved mysteries, character state, and explicit cause-and-effect constraints.
- Added n-gram similarity checks against recent chapter openings and automatic regeneration when openings are too similar.
- Added formula detection for repeated phrases such as window/rain/notebook/power-outage openings.
- Added a “เขียนใหม่ทั้งเล่ม (แก้ตอนเปิดซ้ำ)” action that clears legacy repetitive drafts and regenerates every chapter using the new pipeline.

## 2.1.0 — Novel Engine V2

- Added persistent Story State and per-chapter memory.
- Added deterministic four-scene planning before every chapter draft.
- Added whole-chapter similarity, repeated-paragraph, opening-pattern, and minimum-quality checks.
- Live AI chapters are automatically rewritten up to three times when similarity or repetition is too high.
- Chapter memory now carries location, time, character state, relationship changes, facts, open threads, and next hook into the next chapter.
- Replaced the repeated mock chapter template with twelve distinct opening strategies and scene-specific prose.
- Regenerating the whole book now clears stale chapter memory and rebuilds continuity using Engine V2.
