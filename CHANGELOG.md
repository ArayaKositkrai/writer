<!-- CHANGELOG.md -->

# Changelog

## 0.1.1 - 2026-07-31

### Added

- `.env` และ `.env.example` สำหรับ AI credentials, Ollama endpoint และ timeout
- Environment configuration service
- README แบบเต็ม
- Architecture, Features, Project Progress, Bugs และ Roadmap documentation
- Type definitions สำหรับ Vite environment variables
- `.gitignore` สำหรับ secrets, build artifacts และ logs

### Changed

- AI provider ใช้ endpoint และ timeout จาก environment configuration
- Credential service รองรับ API key จาก `.env` พร้อม session override
- Sidebar แสดงสถานะเมื่อใช้ key จาก `.env`

### Security

- ลบ API key ออกจาก README
- เพิ่มคำเตือนว่า `VITE_*` ไม่เหมาะสำหรับ production secrets

## UI refresh

The workspace was visually redesigned in 2026-07-31. Reference mockup: `docs/ui-design-reference.png`.

## 2026-07-31 — Fantasy UI overhaul

- เปลี่ยนภาพรวม UI เป็นธีม Dark Fantasy / Arcane Library
- เพิ่มพื้นหลังท้องฟ้า ดวงดาว แสงเวทมนตร์ กรอบทอง และพื้นผิวแบบห้องสมุดแฟนตาซี
- ปรับ Sidebar, Topbar, Workflow, Form, Card, Editor, Login และ Export ให้ใช้ภาษาภาพเดียวกัน
- แยกไฟล์ CSS เดิมออกเป็นโมดูลย่อยเพื่อให้ทุกไฟล์ไม่เกินขนาดตามมาตรฐานโปรเจกต์
- แยกค่ารายชื่อ AI model ของ Sidebar ไปไว้ใน `src/components/sidebar-config.ts`
