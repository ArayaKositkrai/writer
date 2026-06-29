import { LockKeyhole, Mail, PenLine, UserRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onContinueAsGuest: () => void;
}

function LoginPage({ onLogin, onContinueAsGuest }: LoginPageProps) {
  return (
    <div className="login-page auth-page">
      <section className="login-panel auth-panel">
        <div className="login-copy">
          <div className="brand-lockup">
            <div className="brand-mark">NS</div>
            <div>
              <p className="eyebrow">Novel Studio</p>
              <h1>พื้นที่เขียนนิยายด้วย AI</h1>
            </div>
          </div>
          <p>
            วางไอเดีย สร้างพล็อต ทำ Story Bible เขียนรายตอน และตรวจคุณภาพก่อนบันทึกเป็นตอนหลัก
            ระบบบัญชียังเป็น mock สำหรับเวอร์ชันทดลอง
          </p>
          <div className="login-feature-row">
            <span>Story Bible</span>
            <span>Chapter Writer</span>
            <span>Quality Review</span>
          </div>
        </div>

        <form className="login-form" onSubmit={(event) => event.preventDefault()}>
          <div className="form-title">
            <PenLine size={20} />
            <div>
              <h2>เข้าสู่ระบบ</h2>
              <p>เริ่มใช้งาน workspace ของนักเขียน</p>
            </div>
          </div>
          <label>
            อีเมล
            <span className="input-with-icon">
              <Mail size={17} />
              <input type="email" placeholder="writer@example.com" />
            </span>
          </label>
          <label>
            รหัสผ่าน
            <span className="input-with-icon">
              <LockKeyhole size={17} />
              <input type="password" placeholder="ยังไม่เชื่อมระบบจริง" />
            </span>
          </label>
          <button className="primary-action inline" type="button" onClick={onLogin}>
            <UserRound size={18} />
            เข้าสู่ระบบ (mock)
          </button>
          <button className="secondary-button" type="button" onClick={onContinueAsGuest}>
            ใช้งานแบบ Guest
          </button>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;
