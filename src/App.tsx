import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Brain, FileText, Sparkles } from 'lucide-react';
import { buildChapters, createDefaultProject } from './data/defaultProject';
import { novelPresets } from './data/presets';
import {
  addProject,
  deleteProject,
  importProjectFile,
  loadAiSettings,
  loadStore,
  replaceActiveProject,
  saveAiSettings,
  saveStore,
} from './services/storage';
import { AiSettings, GenerationJob, NovelProject, WorkflowStep } from './types';
import Sidebar from './components/Sidebar';
import ConfirmDialog from './components/ConfirmDialog';
import TopBar from './components/TopBar';
import WorkflowRouteView from './pages/WorkflowRouteView';
import LoginPage from './pages/LoginPage';
import { loginPath, normalizePath, routeForStep, stepForPath } from './routes';

const AUTH_KEY = 'novel_studio_mock_auth_v1';

const jobTypeLabel: Record<GenerationJob['type'], string> = {
  pitch: 'Step 2 · สร้าง 3 โครงเรื่อง',
  bible: 'Step 3–4 · Story Bible/โครงตอน',
  chapter: 'Step 5 · เขียนต้นฉบับ',
  review: 'Step 5 · ตรวจคุณภาพ',
  rewrite: 'Step 5 · แก้ไข/รีไรต์',
};

function formatGenerationDuration(durationMs?: number) {
  if (durationMs === undefined) return 'ไม่มีข้อมูลเวลา';
  if (durationMs < 1_000) return `${durationMs} ms`;
  if (durationMs < 60_000) return `${(durationMs / 1_000).toFixed(1)} วินาที`;
  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1_000);
  return `${minutes} นาที ${seconds} วินาที`;
}

function App() {
  const [store, setStore] = useState(() => loadStore());
  const [aiSettings, setAiSettings] = useState(() => loadAiSettings());
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [message, setMessage] = useState('พร้อมใช้งานในโหมด Mock AI');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 920);
  const [projectPendingDelete, setProjectPendingDelete] = useState<NovelProject | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');

  const project = useMemo(
    () => store.projects.find((item) => item.id === store.activeProjectId) ?? store.projects[0],
    [store],
  );

  const currentChapter = project.chapters.find((chapter) => chapter.id === project.currentChapterId) ?? project.chapters[0];
  const currentReviews = project.reviews[currentChapter.id] ?? [];
  const step = stepForPath(path);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => {
    saveAiSettings(aiSettings);
  }, [aiSettings]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 920px)');
    const handleBreakpointChange = (event: MediaQueryListEvent) => setSidebarCollapsed(event.matches);
    mobileQuery.addEventListener('change', handleBreakpointChange);
    return () => mobileQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== loginPath) {
      window.history.replaceState({}, '', loginPath);
      setPath(loginPath);
      return;
    }

    if (isAuthenticated && (window.location.pathname === '/' || window.location.pathname === loginPath)) {
      window.history.replaceState({}, '', '/idea-base');
      setPath('/idea-base');
    }

    function handlePopState() {
      const nextPath = normalizePath(window.location.pathname);
      if (!isAuthenticated && nextPath !== loginPath) {
        window.history.replaceState({}, '', loginPath);
        setPath(loginPath);
        return;
      }
      setPath(nextPath);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  function navigate(pathname: string) {
    window.history.pushState({}, '', pathname);
    setPath(normalizePath(pathname));
  }

  function login(mode: 'guest' | 'account') {
    localStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
    setMessage(mode === 'guest' ? 'เข้าสู่ระบบแบบ Guest แล้ว' : 'เข้าสู่ระบบ mock account แล้ว');
    navigate('/idea-base');
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setSidebarCollapsed(false);
    setMessage('ออกจากระบบแล้ว');
    navigate(loginPath);
  }

  function goToStep(stepId: WorkflowStep) {
    navigate(routeForStep(stepId).path);
  }

  function updateProject(updater: (project: NovelProject) => NovelProject, notice?: string) {
    const updated = updater(project);
    const stamped = { ...updated, updatedAt: new Date().toISOString() };
    setStore((current) => replaceActiveProject(current, stamped));
    if (notice) setMessage(notice);
  }

  function updateAiSettings(next: AiSettings) {
    setAiSettings(next);
    const label = next.operationMode === 'api' ? 'Live API' : next.operationMode === 'manual' ? 'Manual Prompt' : 'Mock AI';
    setMessage(`ตั้งค่า AI เป็น ${label} / ${next.model}`);
  }

  function createProject() {
    const nextProject = createDefaultProject();
    setStore((current) => addProject(current, nextProject));
    goToStep('idea');
    setMessage('สร้างนิยายเรื่องใหม่แล้ว');
  }

  function removeProject(projectId: string) {
    const target = store.projects.find((item) => item.id === projectId);
    if (!target) return;
    setProjectPendingDelete(target);
  }

  function confirmRemoveProject() {
    if (!projectPendingDelete) return;
    setStore((current) => deleteProject(current, projectPendingDelete.id));
    setProjectPendingDelete(null);
    setMessage('ลบเรื่องออกจากคลังนิยายแล้ว');
  }

  function applyPreset(presetId: string) {
    const preset = novelPresets.find((item) => item.id === presetId);
    if (!preset) return;

    const baseProject = createDefaultProject();
    const nextProject: NovelProject = {
      ...baseProject,
      title: preset.title,
      idea: preset.idea,
      pitches: [],
      reviews: {},
      jobs: [],
      chapters: buildChapters(preset.idea.chapterCount),
      currentChapterId: 'chapter_1',
      bible: {
        ...baseProject.bible,
        premise: preset.idea.seedIdea,
        styleGuide: `${preset.idea.tone}\n${preset.idea.authorNotes}`,
        canonMemory: ['ใช้สูตรนิยายสำเร็จรูปแล้ว รอเลือกพล็อตและบันทึกตอนหลัก'],
      },
    };

    setStore((current) => addProject(current, nextProject));
    setMessage(`สร้างเรื่องใหม่จากสูตร "${preset.title}" แล้ว`);
    goToStep('idea');
  }

  async function handleImport(file: File) {
    try {
      const imported = await importProjectFile(file);
      setStore((current) => addProject(current, imported));
      goToStep('board');
      setMessage(`นำเข้า "${imported.title}" แล้ว`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'นำเข้าไฟล์ไม่สำเร็จ');
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => login('account')} onContinueAsGuest={() => login('guest')} />;
  }

  return (
    <div className={sidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <Sidebar
        collapsed={sidebarCollapsed}
        projects={store.projects}
        activeProjectId={project.id}
        aiSettings={aiSettings}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        onAiSettingsChange={updateAiSettings}
        onApplyPreset={applyPreset}
        onSelectProject={(projectId) => {
          setStore((current) => ({ ...current, activeProjectId: projectId }));
          setMessage('สลับโปรเจกต์แล้ว');
        }}
        onNewProject={createProject}
        onDeleteProject={removeProject}
        onImportProject={handleImport}
        onLogout={logout}
      />

      {!sidebarCollapsed && <button type="button" className="mobile-sidebar-scrim" onClick={() => setSidebarCollapsed(true)} aria-label="ปิดเมนู" />}

      <main className="workspace">
        <TopBar
          step={step}
          goToStep={goToStep}
          project={project}
          message={message}
          currentPath={path}
          aiSettings={aiSettings}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          onLogout={logout}
        />
        <section className="workspace-body full-step-workspace-body">
          <div className="stage-panel">
            <WorkflowRouteView
              step={step}
              project={project}
              chapter={currentChapter}
              aiSettings={aiSettings}
              updateProject={updateProject}
              goToStep={goToStep}
              onNotice={setMessage}
            />
          </div>

          <aside className="context-panel" aria-label="story context">
            <div className="context-card identity-card">
              <div>
                <p className="eyebrow">Workspace</p>
                <h2>{project.title}</h2>
              </div>
              <span className="mode-pill">{project.ownerMode === 'guest' ? 'Guest' : 'Account'}</span>
            </div>

            <div className="context-card">
              <div className="card-title">
                <Brain size={16} />
                <span>Story Memory</span>
              </div>
              <ul className="compact-list">
                {project.bible.canonMemory.slice(-5).map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="context-card">
              <div className="card-title">
                <BookOpen size={16} />
                <span>ตอนปัจจุบัน</span>
              </div>
              <p className="chapter-context-title">
                ตอนที่ {currentChapter.number}: {currentChapter.title}
              </p>
              <p className="muted">{currentChapter.summary}</p>
              <span className={`status-badge ${currentChapter.status}`}>{currentChapter.status}</span>
            </div>

            <div className="context-card">
              <div className="card-title">
                <Sparkles size={16} />
                <span>Quality Notes</span>
              </div>
              {currentReviews.length ? (
                <ul className="compact-list">
                  {currentReviews.slice(0, 4).map((item) => (
                    <li key={item.id}>{item.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">ยังไม่มีผลตรวจสำหรับตอนนี้</p>
              )}
            </div>

            <div className="context-card">
              <div className="card-title">
                <FileText size={16} />
                <span>AI Log ({project.jobs.length})</span>
              </div>
              {project.jobs.length ? <ul className="job-list">
                {project.jobs.slice(-10).reverse().map((job) => (
                  <li key={job.id}>
                    <strong>{jobTypeLabel[job.type]}</strong>
                    <span className="job-model">{job.provider ?? 'legacy'} / {job.model ?? 'ไม่ระบุโมเดล'} · {formatGenerationDuration(job.durationMs)} · {new Date(job.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{job.resultPreview}</span>
                  </li>
                ))}
              </ul> : <p className="muted">ยังไม่มีการเรียก AI</p>}
            </div>
          </aside>
        </section>
      </main>

      <ConfirmDialog
        open={Boolean(projectPendingDelete)}
        title="ลบเรื่องนี้ออกจากคลัง?"
        description={projectPendingDelete ? `เรื่อง “${projectPendingDelete.title}” และข้อมูลทุกตอนจะถูกลบ การดำเนินการนี้ย้อนกลับไม่ได้` : ''}
        onCancel={() => setProjectPendingDelete(null)}
        onConfirm={confirmRemoveProject}
      />
    </div>
  );
}

export default App;
