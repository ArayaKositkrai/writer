import { ArrowRight, BookOpen, LockKeyhole, Mail, PenLine, Sparkles, UserRound, Wand2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onContinueAsGuest: () => void;
}

function LoginPage({ onLogin, onContinueAsGuest }: LoginPageProps) {
  return (
    <div className="modern-auth-wrapper">
      {/* ของตกแต่งพื้นหลัง (Abstract shapes) */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="modern-auth-container">
        
        {/* Left Column: Branding & Copy */}
        <div className="auth-branding-section">
          <div className="brand-logo-group">
            <div className="modern-brand-mark">
              <Sparkles size={20} color="#ffffff" />
            </div>
            <span className="brand-name">Novel Studio</span>
          </div>
          
          <h1 className="auth-headline">
            ปลดปล่อยจินตนาการ<br />
            <span className="text-gradient">เขียนนิยายด้วย AI</span>
          </h1>
          
          <p className="auth-description">
            ผู้ช่วยอัจฉริยะที่จะเปลี่ยนไอเดียของคุณให้เป็นต้นฉบับรายตอน 
            พร้อมเครื่องมือจัดการพล็อตและ Story Bible ครบวงจร
          </p>
          
          <div className="feature-chips">
            <span className="feature-chip"><BookOpen size={14} /> Story Bible</span>
            <span className="feature-chip"><PenLine size={14} /> Chapter Writer</span>
            <span className="feature-chip"><Wand2 size={14} /> Quality Review</span>
          </div>
        </div>

        {/* Right Column: Form Card */}
        <div className="auth-form-card">
          <div className="form-header">
            <h2>เข้าสู่ระบบ</h2>
            <p>ยินดีต้อนรับกลับสู่พื้นที่ทำงานของคุณ</p>
          </div>
          
          <form className="modern-login-form" onSubmit={(event) => event.preventDefault()}>
            <div className="input-group">
              <label>อีเมล</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="email" placeholder="writer@example.com" />
              </div>
            </div>
            
            <div className="input-group">
              <label>รหัสผ่าน</label>
              <div className="input-wrapper">
                <LockKeyhole size={18} className="input-icon" />
                <input type="password" placeholder="••••••••" />
              </div>
            </div>

            <div className="auth-actions">
              <button className="btn-primary-auth" type="button" onClick={onLogin}>
                เข้าสู่ระบบ (Mock) <ArrowRight size={18} />
              </button>
              
              <div className="auth-divider">
                <span>หรือ</span>
              </div>
              
              <button className="btn-guest-auth" type="button" onClick={onContinueAsGuest}>
                <UserRound size={18} />
                ทดลองใช้งานแบบ Guest
              </button>
            </div>
          </form>
        </div>
        
      </div>

      <style>{`
        /* =========================================================
           MODERN LOGIN PAGE STYLES
           ========================================================= */
        
        .modern-auth-wrapper {
          position: relative;
          width: 100vw;
          height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          overflow: hidden;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        /* ของตกแต่งพื้นหลังให้ดูพรีเมียม */
        .bg-shape {
          position: absolute;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.6;
          border-radius: 50%;
        }
        .shape-1 {
          top: -10%; left: -5%; width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0) 70%);
        }
        .shape-2 {
          bottom: -10%; right: -5%; width: 40vw; height: 40vw;
          background: radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0) 70%);
        }

        /* Container หลัก */
        .modern-auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1000px;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 60px;
          align-items: center;
          padding: 40px;
        }

        /* ================= LEFT COLUMN ================= */
        .auth-branding-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .brand-logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modern-brand-mark {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #ec4899);
          display: grid; place-items: center;
          box-shadow: 0 8px 16px rgba(236, 72, 153, 0.25);
        }
        .brand-name {
          font-size: 1.25rem; font-weight: 800; color: #1e293b; letter-spacing: -0.5px;
        }

        .auth-headline {
          margin: 0;
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.2;
          color: #0f172a;
          letter-spacing: -1px;
        }
        .text-gradient {
          background: linear-gradient(135deg, #4f46e5, #db2777);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-description {
          margin: 0; font-size: 1.1rem; color: #475569; line-height: 1.6; max-width: 480px;
        }

        .feature-chips {
          display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;
        }
        .feature-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 999px;
          background: #ffffff; border: 1px solid #e2e8f0;
          font-size: 0.85rem; font-weight: 600; color: #334155;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        /* ================= RIGHT COLUMN (FORM) ================= */
        .auth-form-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .form-header { margin-bottom: 32px; text-align: center; }
        .form-header h2 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #0f172a; }
        .form-header p { margin: 8px 0 0; font-size: 0.9rem; color: #64748b; }

        .modern-login-form {
          display: flex; flex-direction: column; gap: 20px;
        }

        .input-group {
          display: flex; flex-direction: column; gap: 8px;
        }
        .input-group label {
          font-size: 0.85rem; font-weight: 700; color: #334155; margin-left: 4px;
        }
        
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 16px; color: #94a3b8; pointer-events: none; }
        .input-wrapper input {
          width: 100%; padding: 14px 16px 14px 44px;
          border-radius: 12px; border: 1px solid #cbd5e1; background: #ffffff;
          font-size: 0.95rem; color: #1e293b; transition: all 0.2s;
        }
        .input-wrapper input:focus {
          border-color: #6366f1; outline: none;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .auth-actions {
          display: flex; flex-direction: column; gap: 16px; margin-top: 12px;
        }

        .btn-primary-auth {
          display: flex; justify-content: center; align-items: center; gap: 10px;
          width: 100%; padding: 14px; border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #ffffff; font-size: 1rem; font-weight: 700; border: none;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .btn-primary-auth:hover {
          transform: translateY(-2px); box-shadow: 0 8px 16px rgba(79, 70, 229, 0.4); filter: brightness(1.05);
        }

        .auth-divider {
          display: flex; align-items: center; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 600;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; border-bottom: 1px solid #e2e8f0;
        }
        .auth-divider span { padding: 0 12px; }

        .btn-guest-auth {
          display: flex; justify-content: center; align-items: center; gap: 8px;
          width: 100%; padding: 14px; border-radius: 12px;
          background: transparent; color: #475569; border: 1px solid #cbd5e1;
          font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-guest-auth:hover {
          background: #f1f5f9; color: #0f172a; border-color: #94a3b8;
        }

        /* ================= RESPONSIVE (MOBILE) ================= */
        @media (max-width: 960px) {
          .modern-auth-container {
            grid-template-columns: 1fr;
            gap: 40px; padding: 24px;
            justify-items: center; text-align: center;
          }
          .auth-branding-section { align-items: center; }
          .auth-headline { font-size: 2.2rem; }
          .auth-description { text-align: center; }
          .feature-chips { justify-content: center; }
          
          .auth-form-card {
            width: 100%; max-width: 440px; padding: 32px 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;