# Novel Studio

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิดเมนู **ตั้งค่า AI** ใน sidebar แล้วเลือกโหมดการทำงาน:

- **Mock AI** ใช้ข้อมูลจำลองและไม่เรียก API
- **Manual Prompt** ใช้ flow เดิมสำหรับเตรียม prompt
- **Live API** เรียก Gemini หรือ OpenAI จริงตาม provider/model ที่เลือก

สำหรับ Live API ให้กรอก API key ของ provider แล้วกด **บันทึก** Key จะเก็บใน `sessionStorage` ของแท็บปัจจุบันเท่านั้นและจะหายเมื่อปิดแท็บ

> การเรียก API จาก browser ทำให้ key เข้าถึงได้จาก JavaScript เหมาะสำหรับใช้งานส่วนตัวแบบ BYOK เท่านั้น ไม่ควร deploy เป็นเว็บสาธารณะโดยไม่มี backend proxy

## ตรวจสอบ production build

```bash
npm run build
```
