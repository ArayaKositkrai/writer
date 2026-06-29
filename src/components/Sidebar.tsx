import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  FileUp,
  Library,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { novelPresets } from '../data/presets';
import { AiSettings, NovelProject } from '../types';

interface SidebarProps {
  collapsed: boolean;
  projects: NovelProject[];
  activeProjectId: string;
  aiSettings: AiSettings;
  onToggleCollapse: () => void;
  onAiSettingsChange: (settings: AiSettings) => void;
  onApplyPreset: (presetId: string) => void;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onImportProject: (file: File) => void;
  onLogout: () => void;
}

const modelOptions = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
];

const operationModeDescriptions = {
  mock: 'Mock AI: ทดลองใช้งานด้วยข้อมูลจำลอง ไม่เรียก API จริง',
  manual: 'Manual Prompt: ให้ระบบช่วยจัด prompt แล้วคนเขียนนำไปใช้เอง',
  api: 'Live API: เรียกโมเดลจริงผ่าน API สำหรับผลลัพธ์จริง',
};

function Sidebar({
  collapsed,
  projects,
  activeProjectId,
  aiSettings,
  onToggleCollapse,
  onAiSettingsChange,
  onApplyPreset,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onImportProject,
  onLogout,
}: SidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  // กรองโปรเจกต์ตามคำค้นหา
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImportProject(file);
    event.target.value = '';
  }

  return (
    <>
      <aside className={`vibrant-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
        
        {/* ปุ่มย่อ-ขยายที่อยู่ตรงเส้นขอบ */}
        <button 
          className="edge-collapse-btn" 
          onClick={onToggleCollapse} 
          title={collapsed ? 'ขยายแถบเครื่องมือ' : 'ย่อแถบเครื่องมือ'}
          aria-label={collapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* 1. Header & Brand */}
        <div className="vsb-header">
          <div className="vsb-brand-mark">
            <Sparkles size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div className="vsb-brand-text">
              <h2>Novel Studio</h2>
              <p>AI Writer Workspace</p>
            </div>
          )}
        </div>

        {/* 2. Search Box */}
        {!collapsed ? (
          <div className="vsb-search-wrap">
            <div className="vsb-search">
              <Search size={14} className="icon" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อเรื่อง..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="vsb-collapsed-nav">
            <button className="collapsed-nav-button tooltip-right" onClick={onToggleCollapse} data-tooltip="ค้นหา" aria-label="ค้นหา">
              <Search size={14} />
            </button>
          </div>
        )}

        {/* ส่วนเนื้อหาหลัก - ไม่ให้ Scroll ทะลุ */}
        <div className="vsb-main-content">
          
          {/* 3. คลังนิยาย (โชว์สูงสุด 6 เรื่อง) */}
          <section className="vsb-section">
            <div className="vsb-section-header">
              {!collapsed ? (
                <>
                  <div className="title-group">
                    <div className="icon-box bg-blue"><Library size={14} /></div>
                    <span>คลังนิยาย <span className="badge">{projects.length}</span></span>
                  </div>
                  <div className="action-group">
                    <input ref={fileRef} type="file" accept=".json,.md,application/json,text/markdown,text/plain" style={{ display: 'none' }} onChange={handleFile} />
                    <button className="icon-btn tooltip-bottom" onClick={() => fileRef.current?.click()} data-tooltip="นำเข้าไฟล์ (.json, .md)">
                      <FileUp size={14} />
                    </button>
                    <button className="icon-btn tooltip-bottom primary" onClick={onNewProject} data-tooltip="สร้างเรื่องใหม่">
                      <Plus size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <button className="collapsed-nav-button" onClick={onToggleCollapse}>
                  <Library size={14} />
                </button>
              )}
            </div>

            {!collapsed && <div className="vsb-project-list">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div key={project.id} className={`project-item ${project.id === activeProjectId ? 'active' : ''}`}>
                    <button className="project-btn" onClick={() => onSelectProject(project.id)} title={project.title}>
                      <span className="color-dot"></span>
                      {!collapsed && <span className="text">{project.title}</span>}
                    </button>
                    {!collapsed && (
                      <button
                        className="project-delete-btn"
                        onClick={() => onDeleteProject(project.id)}
                        title={`ลบเรื่อง ${project.title}`}
                        aria-label={`ลบเรื่อง ${project.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                !collapsed && <div className="empty-text">ไม่พบเรื่องที่ค้นหา</div>
              )}
            </div>}
          </section>

          {/* 4. ตั้งค่า AI */}
          <section className="vsb-section">
            <button
              className={`vsb-accordion-btn ${collapsed ? 'tooltip-right' : ''}`}
              data-tooltip="ตั้งค่า AI"
              onClick={() => {
                if (collapsed) {
                  setIsAiOpen(true);
                  onToggleCollapse();
                  return;
                }
                setIsAiOpen(!isAiOpen);
              }}
            >
              <div className="title-group">
                <div className="icon-box bg-purple"><Bot size={14} /></div>
                {!collapsed && <span>ตั้งค่า AI</span>}
              </div>
              {!collapsed && (isAiOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            
            {!collapsed && isAiOpen && (
              <div className="vsb-accordion-body">
                <div className="input-group">
                  <label>โหมด</label>
                  <select value={aiSettings.operationMode} onChange={(e) => onAiSettingsChange({ ...aiSettings, operationMode: e.target.value as AiSettings['operationMode'] })}>
                    <option value="mock">Mock AI</option>
                    <option value="manual">Manual Prompt</option>
                    <option value="api">Live API</option>
                  </select>
                  <p className="mode-explain">{operationModeDescriptions[aiSettings.operationMode]}</p>
                </div>
                <div className="input-group">
                  <label>โมเดล</label>
                  <select value={aiSettings.model} onChange={(e) => onAiSettingsChange({ ...aiSettings, provider: 'gemini', model: e.target.value })}>
                    {modelOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* 5. สูตรสำเร็จรูป (สร้างเรื่องใหม่) */}
          <section className="vsb-section">
            <button
              className={`vsb-accordion-btn ${collapsed ? 'tooltip-right' : ''}`}
              data-tooltip="สูตรสำเร็จรูป"
              onClick={() => {
                if (collapsed) {
                  setIsPresetsOpen(true);
                  onToggleCollapse();
                  return;
                }
                setIsPresetsOpen(!isPresetsOpen);
              }}
            >
              <div className="title-group">
                <div className="icon-box bg-orange"><Database size={14} /></div>
                {!collapsed && <span>สูตรสำเร็จรูป</span>}
              </div>
              {!collapsed && (isPresetsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            
            {!collapsed && isPresetsOpen && (
              <div className="vsb-accordion-body preset-list">
                {novelPresets.map((preset) => (
                  <button key={preset.id} className="preset-btn" onClick={() => onApplyPreset(preset.id)}>
                    <div className="preset-info">
                      <strong className="preset-title">{preset.title}</strong>
                      <span className="preset-badge">{preset.badge}</span>
                    </div>
                    <div className="preset-action" title="สร้างเป็นเรื่องใหม่">
                      <Plus size={14} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* 6. Footer (Logout) */}
        <div className="vsb-footer">
          <button className="logout-btn" onClick={onLogout} title="ออกจากระบบ">
            <LogOut size={16} className="logout-icon" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* CSS สีสันสดใส & Layout ห้าม Scroll มั่ว */}
      <style>{`
        /* ตัวแปรสีสันใหม่สำหรับ Sidebar นี้โดยเฉพาะ */
        :root {
          --vsb-blue-bg: #e0e7ff; --vsb-blue-text: #4338ca;
          --vsb-purple-bg: #fae8ff; --vsb-purple-text: #a21caf;
          --vsb-orange-bg: #ffedd5; --vsb-orange-text: #c2410c;
        }

        .vibrant-sidebar {
          position: relative;
          width: 270px;
          height: 100dvh;
          background: #ffffff;
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          font-size: 14px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: visible; /* ให้ปุ่มขอบลอยทะลุได้ */
          box-shadow: 2px 0 20px rgba(0,0,0,0.03);
          z-index: 50;
        }
        .vibrant-sidebar.is-collapsed { width: 72px; }

        /* ปุ่มย่อขยายตรงเส้นขอบ */
        .edge-collapse-btn {
          position: absolute;
          top: 36px;
          right: -12px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid var(--line-strong);
          color: var(--text-2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          z-index: 60;
          transition: all 0.2s;
        }
        .edge-collapse-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          transform: scale(1.1);
        }

        /* 1. Header */
        .vsb-header {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 18px;
          flex-shrink: 0;
        }
        .is-collapsed .vsb-header { justify-content: center; padding-inline: 0; }
        .vsb-brand-mark {
          flex: 0 0 36px; width: 36px; height: 36px;
          display: grid; place-items: center; border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #ec4899);
          box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
        }
        .vsb-brand-text h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text); }
        .vsb-brand-text p { margin: 0; font-size: 0.75rem; color: #ec4899; font-weight: 600; }

        /* 2. Search */
        .vsb-search-wrap { padding: 0 16px 12px; flex-shrink: 0; border-bottom: 1px solid var(--line); }
        .vsb-collapsed-nav {
          display: grid;
          justify-items: center;
          padding: 0 0 8px;
          border-bottom: 1px solid var(--line);
          flex-shrink: 0;
        }
        .vsb-search { position: relative; display: flex; align-items: center; }
        .vsb-search .icon { position: absolute; left: 12px; color: var(--muted); }
        .vsb-search input {
          width: 100%; padding: 8px 12px 8px 36px; border-radius: 8px;
          border: 1px solid transparent; background: var(--surface-soft);
          font-size: 0.85rem; transition: all 0.2s;
        }
        .vsb-search input:focus { border-color: var(--primary-line); background: #fff; box-shadow: 0 0 0 3px var(--primary-soft); }

        /* 3. Main Content Wrapper */
        .vsb-main-content {
          min-height: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 12px 0;
        }

        .vsb-section { margin-bottom: 8px; display: flex; flex-direction: column; }
        .is-collapsed .vsb-section { margin-bottom: 4px; }
        
        /* Section Header & Icons */
        .vsb-section-header, .vsb-accordion-btn {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 16px; width: 100%; background: transparent; border: none; cursor: pointer;
        }
        .is-collapsed .vsb-section-header, .is-collapsed .vsb-accordion-btn {
          justify-content: center;
          padding: 8px 0;
        }
        .title-group { display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--text); font-size: 0.9rem; }
        .is-collapsed .title-group { justify-content: center; }
        .icon-box {
          width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px;
        }
        .bg-blue { background: var(--vsb-blue-bg); color: var(--vsb-blue-text); }
        .bg-purple { background: var(--vsb-purple-bg); color: var(--vsb-purple-text); }
        .bg-orange { background: var(--vsb-orange-bg); color: var(--vsb-orange-text); }

        .badge { background: var(--line); color: var(--text-2); padding: 2px 6px; border-radius: 20px; font-size: 0.7rem; margin-left: 6px; }
        
        .action-group { display: flex; gap: 6px; }
        .icon-btn {
          width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px;
          border: 1px solid var(--line); background: #fff; color: var(--text-2); cursor: pointer; transition: all 0.2s;
        }
        .icon-btn:hover { background: var(--surface-soft); color: var(--text); }
        .icon-btn.primary { background: var(--primary-soft); border-color: transparent; color: var(--primary); }
        .icon-btn.primary:hover { background: var(--primary); color: #fff; }
        .block-center { margin: 0 auto; width: 32px; height: 32px; }
        .collapsed-nav-button {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--text-2);
          cursor: pointer;
        }
        .collapsed-nav-button:hover {
          background: var(--primary-soft);
          border-color: var(--primary-line);
          color: var(--primary);
        }

        /* Project List: โชว์ 6 เรื่อง ถ้า 1 เรื่องสูง 36px -> 6 เรื่อง = 216px */
        .vsb-project-list {
          max-height: 230px; /* คำนวณให้พอดี 6 เรื่องบวกระยะห่างนิดหน่อย */
          overflow-y: auto; overflow-x: hidden;
          padding: 4px 16px; margin-top: 4px;
        }
        .vsb-project-list::-webkit-scrollbar { width: 5px; }
        .vsb-project-list::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 10px; }
        
        .project-item {
          display: grid; grid-template-columns: minmax(0, 1fr) 30px; gap: 4px; align-items: center;
          margin-bottom: 4px; border-radius: 8px; transition: all 0.2s;
        }
        .is-collapsed .project-item { grid-template-columns: 1fr; }
        .project-item:hover { background: var(--surface-soft); }
        .project-item.active { background: var(--primary-soft); }
        
        .project-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          background: transparent; border: none; padding: 8px 10px;
          color: var(--text); font-size: 0.85rem; font-weight: 500; cursor: pointer;
        }
        .project-delete-btn {
          width: 28px; height: 28px; display: grid; place-items: center;
          border-radius: 6px; border: 1px solid transparent; background: transparent;
          color: var(--muted); cursor: pointer;
        }
        .project-delete-btn:hover { background: var(--danger-soft); color: var(--danger); border-color: var(--danger-soft); }
        .color-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--line-strong); transition: all 0.2s; }
        .project-item.active .color-dot { background: var(--primary); box-shadow: 0 0 6px var(--primary); }
        .project-btn .text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; text-align: left; }
        .empty-text { font-size: 0.8rem; color: var(--muted); text-align: center; padding: 10px; }

        /* Accordion Body */
        .vsb-accordion-btn:hover { background: var(--surface-soft); }
        .vsb-accordion-body { padding: 4px 16px 12px; display: flex; flex-direction: column; gap: 8px; }
        .input-group { display: flex; flex-direction: column; gap: 4px; }
        .input-group label { font-size: 0.75rem; color: var(--text-2); font-weight: 700; }
        .mode-explain {
          margin: 0;
          color: var(--text-2);
          font-size: 0.72rem;
          font-weight: 500;
          line-height: 1.4;
        }
        .input-group select {
          width: 100%; padding: 6px 8px; font-size: 0.8rem; border-radius: 6px;
          border: 1px solid var(--line); background: #fff; outline: none;
        }
        .input-group select:focus { border-color: var(--primary); }

        /* Presets */
        .preset-list { gap: 6px; }
        .preset-btn {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 8px 10px; background: #fff; border: 1px solid var(--line);
          border-radius: 8px; cursor: pointer; transition: all 0.2s;
        }
        .preset-btn:hover { border-color: var(--vsb-orange-text); background: var(--vsb-orange-bg); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(194, 65, 12, 0.1); }
        .preset-info { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .preset-title { font-size: 0.8rem; color: var(--text); }
        .preset-badge { font-size: 0.65rem; color: var(--text-2); }
        .preset-action {
          width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%;
          background: #fff; color: var(--vsb-orange-text); opacity: 0.5; transition: all 0.2s;
        }
        .preset-btn:hover .preset-action { opacity: 1; background: var(--vsb-orange-text); color: #fff; }

        /* Footer (Logout) */
        .vsb-footer {
          padding: 16px; border-top: 1px solid var(--line); flex-shrink: 0;
        }
        .logout-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 10px; border-radius: 8px;
          background: var(--danger-soft); border: 1px solid transparent;
          color: var(--danger); font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .logout-btn:hover { background: var(--danger); color: #fff; box-shadow: 0 4px 12px rgba(207, 63, 63, 0.2); }
        .is-collapsed .logout-btn { padding: 10px 0; }

        /* Tooltip CSS */
        .tooltip-bottom { position: relative; }
        .tooltip-bottom::after {
          content: attr(data-tooltip);
          position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%);
          background: #172033; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem;
          white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 100;
        }
        .tooltip-bottom:hover::after { opacity: 1; }
        .tooltip-right { position: relative; }
        .tooltip-right::after {
          content: attr(data-tooltip);
          position: absolute; left: calc(100% + 8px); top: 50%; transform: translateY(-50%);
          background: #172033; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem;
          white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 100;
        }
        .tooltip-right:hover::after { opacity: 1; }
      `}</style>
    </>
  );
}

export default Sidebar;
