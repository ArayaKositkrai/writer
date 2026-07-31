<!-- BUGS.md -->

# Bugs and Known Issues

## Critical

### API key ยังถูกใช้ใน frontend

แม้ย้ายค่าออกจาก source code ไป `.env` แล้ว แต่ตัวแปร `VITE_*` ยังถูก bundle ไปฝั่ง browser เมื่อ build

**แนวทางแก้:** สร้าง backend proxy และเก็บ secret ใน server-only environment variables

### Authentication ไม่ใช่ระบบบัญชีจริง

สถานะ login ปัจจุบันอาศัย Local Storage จึงไม่สามารถใช้ควบคุมสิทธิ์หรือป้องกันข้อมูลได้

**แนวทางแก้:** ใช้ backend session/JWT พร้อม secure cookie

## High

### ข้อมูลโปรเจกต์อยู่ใน Local Storage เท่านั้น

การล้าง browser data หรือเปลี่ยนอุปกรณ์ทำให้ข้อมูลหายได้

**แนวทางแก้:** เพิ่ม database, cloud sync และ scheduled backup

### ไม่มี version history

การเขียนทับหรือ AI rewrite อาจทำให้ข้อความเก่าหายโดยย้อนกลับไม่ได้

**แนวทางแก้:** เก็บ snapshots/deltas และเพิ่ม restore UI

### Model ID อาจไม่ตรงกับ provider

รายการโมเดลใน UI ต้องตรวจสอบกับ provider ก่อนนำไปใช้ production

**แนวทางแก้:** โหลด model catalog จาก backend configuration หรือ provider API

## Medium

### ไม่มี automated tests

AI flow, import/export และ storage migration ยังไม่มี unit/integration tests

### ไม่มี storage schema migration

เมื่อ `NovelProject` เปลี่ยนโครงสร้าง ข้อมูลเก่าใน Local Storage อาจโหลดผิดหรือข้อมูลบางส่วนหาย

### Error recovery ยังจำกัด

ยังไม่มี exponential backoff, retry queue หรือ resume generation

### Export ควรทดสอบกับต้นฉบับขนาดใหญ่

ควรทดสอบรูปแบบ paragraph, spacing, Unicode ภาษาไทย และไฟล์หลายร้อยตอน

## Low

- ควรเพิ่ม empty states และ loading skeleton ให้ครบทุกหน้า
- ควรเพิ่ม keyboard shortcuts
- ควรเพิ่ม accessibility audit
- ควรเพิ่ม responsive test สำหรับหน้าจอขนาดเล็ก
