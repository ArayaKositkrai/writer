import { ArrowRight, BookOpen, LockKeyhole, Mail, Moon, PenLine, Sparkles, Sun, UserRound, Wand2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onContinueAsGuest: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function LoginPage({ onLogin, onContinueAsGuest, theme, onToggleTheme }: LoginPageProps) {
  return (
    <div className="modern-auth-wrapper">
      {/* ของตกแต่งพื้นหลัง (Abstract shapes) */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <button
        type="button"
        className="auth-theme-toggle"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
        title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

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
          background-color: var(--bg);
          overflow: hidden;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        .auth-theme-toggle {
          position: absolute;
          top: 20px; right: 20px;
          z-index: 20;
          width: 40px; height: 40px;
          display: grid; place-items: center;
          border-radius: 999px;
          border: 1px solid var(--line-strong);
          background: var(--surface);
          color: var(--text-2);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: all 0.2s;
        }
        .auth-theme-toggle:hover { color: var(--primary); border-color: var(--primary-line); background: var(--primary-soft); }

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
          background: radial-gradient(circle, rgba(109,94,247,0.32) 0%, rgba(109,94,247,0) 70%);
        }
        .shape-2 {
          bottom: -10%; right: -5%; width: 40vw; height: 40vw;
          background: radial-gradient(circle, rgba(236,72,153,0.22) 0%, rgba(236,72,153,0) 70%);
        }
        .shape-3 {
          top: 30%; right: 15%; width: 26vw; height: 26vw;
          background: radial-gradient(circle, rgba(15,184,166,0.2) 0%, rgba(15,184,166,0) 70%);
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
          border-radius: 14px;
          background: var(--brand-gradient);
          display: grid; place-items: center;
          box-shadow: 0 8px 16px rgba(236, 72, 153, 0.3);
        }
        .brand-name {
          font-size: 1.25rem; font-weight: 800; color: var(--text); letter-spacing: -0.5px;
        }

        .auth-headline {
          margin: 0;
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.2;
          color: var(--text);
          letter-spacing: -1px;
        }
        .text-gradient {
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-description {
          margin: 0; font-size: 1.1rem; color: var(--text-2); line-height: 1.6; max-width: 480px;
        }

        .feature-chips {
          display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;
        }
        .feature-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 999px;
          background: var(--surface); border: 1px solid var(--line);
          font-size: 0.85rem; font-weight: 600; color: var(--text-2);
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
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        [data-theme="dark"] .auth-form-card {
          background: rgba(30, 41, 59, 0.78);
          border-color: rgba(148, 163, 184, 0.16);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .form-header { margin-bottom: 32px; text-align: center; }
        .form-header h2 { margin: 0; font-size: 1.75rem; font-weight: 800; color: var(--text); }
        .form-header p { margin: 8px 0 0; font-size: 0.9rem; color: var(--text-2); }

        .modern-login-form {
          display: flex; flex-direction: column; gap: 20px;
        }

        .input-group {
          display: flex; flex-direction: column; gap: 8px;
        }
        .input-group label {
          font-size: 0.85rem; font-weight: 700; color: var(--text-2); margin-left: 4px;
        }
        
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 16px; color: var(--muted); pointer-events: none; }
        .input-wrapper input {
          width: 100%; padding: 14px 16px 14px 44px;
          border-radius: 12px; border: 1px solid var(--line-strong); background: var(--surface);
          font-size: 0.95rem; color: var(--text); transition: all 0.2s;
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
          width: 100%; padding: 14px; border-radius: 999px;
          background: var(--brand-gradient);
          color: #ffffff; font-size: 1rem; font-weight: 700; border: none;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 6px 16px rgba(109, 94, 247, 0.35);
        }
        .btn-primary-auth:hover {
          transform: translateY(-2px); box-shadow: 0 10px 22px rgba(109, 94, 247, 0.45); filter: brightness(1.05);
        }

        .auth-divider {
          display: flex; align-items: center; text-align: center; color: var(--muted); font-size: 0.85rem; font-weight: 600;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; border-bottom: 1px solid var(--line);
        }
        .auth-divider span { padding: 0 12px; }

        .btn-guest-auth {
          display: flex; justify-content: center; align-items: center; gap: 8px;
          width: 100%; padding: 14px; border-radius: 999px;
          background: transparent; color: var(--text-2); border: 1px solid var(--line-strong);
          font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-guest-auth:hover {
          background: var(--surface-soft); color: var(--text); border-color: var(--muted);
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