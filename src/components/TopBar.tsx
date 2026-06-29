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
  onLogout,
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
        </div>
      </header>

      <style>{`
        .line-stepper-container {
          display: flex;
          align-items: center;
          width: max-content;
          max-width: 100%;
          background: #f4f5f8;
          border: 1px solid #e2e8f0;
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
          color: #64748b;
          font-size: 0.66rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .phase-short { display: none; }
        .workflow-phase-divider { width: 1px; height: 26px; background: #cbd5e1; margin: 0 12px; }

        .line-step-group {
          display: flex;
          align-items: center;
        }

        /* ล็อกความยาวเส้นเชื่อมให้เท่ากันทุกข้อ */
        .line-step-divider {
          width: 24px;
          height: 1px;
          background: #cbd5e1;
          margin: 0 8px;
        }
        
        .line-step-divider.divider-completed {
          background: #00a67d;
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
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #94a3b8;
          font-size: 0.72rem;
          font-weight: 700;
          transition: all 0.3s;
        }

        .line-step-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #64748b;
          white-space: nowrap;
        }

        /* สถานะ: ผ่านไปแล้ว (Completed) */
        .line-step.completed .line-step-num {
          background: #00a67d;
          border-color: #00a67d;
          color: #ffffff;
        }
        .line-step.completed .line-step-label {
          color: #00a67d;
        }

        /* สถานะ: ปัจจุบัน (Active) */
        .line-step.active .line-step-num {
          background: #5542f6;
          border-color: #5542f6;
          color: #ffffff;
          box-shadow: 0 0 0 4px rgba(85, 66, 246, 0.15);
        }
        .line-step.active .line-step-label {
          color: #5542f6;
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
