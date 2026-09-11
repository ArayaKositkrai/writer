# Novel Studio

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

## ใช้ Gemma 4

- Google AI: เลือก `Google AI (Gemini/Gemma)` → `Gemma 4 26B A4B` และใส่ Google AI API key
- Ollama local: ติดตั้ง Ollama แล้วรัน:

```bash
ollama pull gemma4:e4b
ollama serve
```

จากนั้นเลือก `Ollama (Local)` → `Gemma 4 E4B` และตั้งโหมดเป็น `Live API` ระบบจะเรียก `http://localhost:11434/api/chat` โดยไม่ต้องใช้ API key

`gemma4:e4b` เป็นค่าแนะนำสำหรับความเร็ว ส่วน `gemma4:26b` และ `gemma4:31b` ให้คุณภาพสูงกว่าแต่ใช้เวลาและทรัพยากรมากกว่า

## การเขียนตอน

- ระบบนับคำภาษาไทยด้วย word segmentation และเขียนต่ออัตโนมัติหากยังต่ำกว่าจำนวนคำขั้นต่ำ
- ช่องแก้ไขต้นฉบับรองรับตัวหนา ตัวเอียง ย่อหน้า พารากราฟ เว้นบรรทัด และระยะบรรทัด 1.0/1.5/2.0

## ดาวน์โหลดต้นฉบับ

หน้า Export รองรับไฟล์ที่นำไปใช้ต่อได้จริง:

- `.docx` ต้นฉบับ Word แบบ Office Open XML ทั้งรายตอนและทั้งเล่ม
- `.md` สำหรับ Markdown editor และระบบ version control
- `.json` สำหรับสำรองและนำโปรเจกต์กลับเข้าระบบ

เปิดเมนู **ตั้งค่า AI** ใน sidebar แล้วเลือกโหมดการทำงาน:

- **Mock AI** ใช้ข้อมูลจำลองและไม่เรียก API
- **Manual Prompt** ใช้ flow เดิมสำหรับเตรียม prompt
- **Live API** เรียก Gemini หรือ OpenAI จริงตาม provider/model ที่เลือก

สำหรับ Live API ให้กรอก API key ของ provider แล้วกด **บันทึก** Key จะเก็บใน `sessionStorage` ของแท็บปัจจุบันเท่านั้นและจะหายเมื่อปิดแท็บ

## ตรวจสอบ production build

```bash
npm run build
```
