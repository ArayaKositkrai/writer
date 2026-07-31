// src/components/TopBar.tsx

import { Menu, PanelLeftClose } from 'lucide-react';
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
        </div>
      </header>

    </>
  );
}

export default TopBar;
