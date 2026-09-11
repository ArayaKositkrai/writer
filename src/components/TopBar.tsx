import { Menu, Moon, PanelLeftClose, Sun } from 'lucide-react';
import { WorkflowStep, NovelProject, AiSettings } from '../types';
import { loginPath, workflowRoutes } from '../routes';

interface TopBarProps {
  step: WorkflowStep;
  goToStep: (step: WorkflowStep) => void;
  project: NovelProject;
  message: string;
  currentPath: string;
  aiSettings: AiSettings;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function TopBar({
  step,
  goToStep,
  project,
  message,
  currentPath,
  aiSettings,
  sidebarCollapsed,
  onToggleSidebar,
  theme,
  onToggleTheme,
}: TopBarProps) {
  const currentIndex = workflowRoutes.findIndex((item) => item.step === step);
  const workflowPhases = [
    { label: 'โครงสร้างทั้งเรื่อง', shortLabel: 'ทั้งเรื่อง', routes: workflowRoutes.slice(0, 3), offset: 0 },
    { label: 'ทำงานรายตอน', shortLabel: 'รายตอน', routes: workflowRoutes.slice(3), offset: 3 },
  ];

  return (
    <>
      <header className="top-bar">
        <div className="top-left">
          <button type="button" className="sidebar-toggle-button" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? 'เปิดแถบด้านข้าง' : 'ปิดแถบด้านข้าง'}>
            {sidebarCollapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <div className="top-title">
            <span className="eyebrow">Novel Studio</span>
            <h1>{project.title}</h1>
            <p className="status-line">{message}</p>
          </div>
        </div>

        <nav className="line-stepper-container" aria-label="workflow">
          <div className="line-stepper-scroll">
            {workflowPhases.map((phase, phaseIndex) => (
              <div className="workflow-phase" key={phase.label}>
                <span className="workflow-phase-label"><span className="phase-long">{phase.label}</span><span className="phase-short">{phase.shortLabel}</span></span>
                <div className="workflow-phase-steps">
                {phase.routes.map((item, localIndex) => {
              const index = phase.offset + localIndex;
              const isActive = index === currentIndex && currentPath !== loginPath;
              const isCompleted = index < currentIndex && currentPath !== loginPath;
              const isLast = localIndex === phase.routes.length - 1;

              let statusClass = 'upcoming';
              if (isActive) statusClass = 'active';
              else if (isCompleted) statusClass = 'completed';

              return (
                <div key={item.step} className="line-step-group">
                  <button
                    className={`line-step ${statusClass}`}
                    onClick={() => goToStep(item.step)}
                  >
                    <span className="line-step-num">{index + 1}</span>
                    <span className="line-step-label">{item.shortLabel}</span>
                  </button>

                  {/* เส้นเชื่อมแบบล็อกระยะห่าง */}
                  {!isLast && (
                    <div className={`line-step-divider ${isCompleted ? 'divider-completed' : ''}`}></div>
                  )}
                </div>
              );
                })}
                </div>
                {phaseIndex === 0 && <div className="workflow-phase-divider" />}
              </div>
            ))}
          </div>
        </nav>

        <div className="top-actions">
          <span className={`api-badge ${aiSettings.operationMode === 'api' ? 'connected' : 'disconnected'}`}>
            {aiSettings.operationMode === 'api' ? 'Live API' : aiSettings.operationMode === 'manual' ? 'Manual' : 'Mock'}
          </span>
          <span className="model-pill">{aiSettings.model}</span>
          <button
            type="button"
            className="theme-toggle-button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          >
            <span className={`theme-toggle-track ${theme}`}>
              <Sun size={13} className="theme-icon sun" />
              <Moon size={13} className="theme-icon moon" />
              <span className="theme-toggle-knob" />
            </span>
          </button>
        </div>
      </header>

      <style>{`
        .line-stepper-container {
          display: flex;
          align-items: center;
          width: max-content;
          max-width: 100%;
          background: var(--surface-soft);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 6px 14px;
          overflow-x: auto;
          justify-self: start;
          margin-left: 10px;
        }

        .line-stepper-container::-webkit-scrollbar {
          display: none; /* ซ่อน Scrollbar */
        }

        .line-stepper-scroll {
          display: flex;
          align-items: center;
        }

        .workflow-phase, .workflow-phase-steps {
          display: flex;
          align-items: center;
        }

        .workflow-phase-label {
          margin-right: 9px;
          color: var(--muted);
          font-size: 0.66rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .phase-short { display: none; }
        .workflow-phase-divider { width: 1px; height: 26px; background: var(--line-strong); margin: 0 12px; }

        .line-step-group {
          display: flex;
          align-items: center;
        }

        /* ล็อกความยาวเส้นเชื่อมให้เท่ากันทุกข้อ */
        .line-step-divider {
          width: 24px;
          height: 1px;
          background: var(--line-strong);
          margin: 0 8px;
        }

        .line-step-divider.divider-completed {
          background: var(--ok);
        }

        .line-step {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .line-step:hover {
          transform: translateY(-1px);
        }

        /* ตัวเลขในวงกลม */
        .line-step-num {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid var(--line-strong);
          background: var(--surface);
          color: var(--muted);
          font-size: 0.72rem;
          font-weight: 700;
          transition: all 0.3s;
        }

        .line-step-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-2);
          white-space: nowrap;
        }

        /* สถานะ: ผ่านไปแล้ว (Completed) */
        .line-step.completed .line-step-num {
          background: var(--ok);
          border-color: var(--ok);
          color: #ffffff;
        }
        .line-step.completed .line-step-label {
          color: var(--ok);
        }

        /* สถานะ: ปัจจุบัน (Active) */
        .line-step.active .line-step-num {
          background: var(--primary);
          border-color: var(--primary);
          color: #ffffff;
          box-shadow: 0 0 0 4px var(--primary-soft);
        }
        .line-step.active .line-step-label {
          color: var(--primary);
        }

        /* Theme toggle */
        .theme-toggle-button {
          display: inline-flex;
          align-items: center;
          border: 0;
          background: transparent;
          padding: 0;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .theme-toggle-track {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          width: 46px;
          height: 26px;
          border-radius: 999px;
          border: 1px solid var(--line-strong);
          background: var(--surface-soft);
          padding: 0 6px;
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .theme-toggle-track.dark {
          background: #0b1222;
          border-color: #334155;
        }
        .theme-icon {
          position: relative;
          z-index: 1;
          color: var(--muted);
          transition: color 0.25s ease;
        }
        .theme-toggle-track.light .theme-icon.sun { color: var(--warning); }
        .theme-toggle-track.dark .theme-icon.moon { color: #c7d2fe; }
        .theme-toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--brand-gradient);
          box-shadow: 0 2px 6px rgba(109, 94, 247, 0.45);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-toggle-track.dark .theme-toggle-knob {
          transform: translateX(20px);
        }

        /* Responsive มือถือ */
        @media (max-width: 920px) {
          .line-step-label { display: none; }
          .line-step-divider { width: 16px; margin: 0 4px; }
          .line-stepper-container { margin-left: 0; padding: 6px 12px; }
          .phase-long { display: none; }
          .phase-short { display: inline; }
          .workflow-phase-label { margin-right: 5px; }
          .workflow-phase-divider { margin: 0 7px; }
        }
      `}</style>
    </>
  );
}

export default TopBar;
