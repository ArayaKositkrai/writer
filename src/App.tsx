// src/App.tsx

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Download,
  Feather,
  LibraryBig,
  Menu,
  Plus,
  Settings,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { createDefaultProject } from './data/defaultProject';
import {
  buildStoryBibleFromPitch,
  draftChapter,
  generatePitchOptions,
  summarizeCanonUpdate,
} from './services/aiService';
import {
  downloadProjectDocx,
  downloadProjectJson,
  downloadProjectMarkdown,
} from './services/exporter';
import {
  defaultAiSettings,
  loadAiSettings,
  saveAiSettings,
} from './services/storage';
import type { AiSettings, NovelProject, PitchOption } from './types';
import { appEnv } from './services/env';
import { buildStoryState, createChapterMemory } from './services/chapterEngine';
import SetupView from './components/SetupView';
import GenerateView from './components/GenerateView';
import ReaderView from './components/ReaderView';
import ExportView from './components/ExportView';
import SettingsView from './components/SettingsView';

export type AppView = 'setup' | 'generate' | 'reader' | 'export' | 'settings';

const PROJECT_KEY = 'novel-studio-v3-project';

function loadProject(): NovelProject {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    return raw ? JSON.parse(raw) as NovelProject : createDefaultProject();
  } catch {
    return createDefaultProject();
  }
}

const navItems = [
  { id: 'setup' as const, label: 'เริ่มเรื่อง', icon: Feather },
  { id: 'generate' as const, label: 'ให้ AI เขียน', icon: WandSparkles },
  { id: 'reader' as const, label: 'อ่านต้นฉบับ', icon: BookOpen },
  { id: 'export' as const, label: 'ดาวน์โหลด', icon: Download },
  { id: 'settings' as const, label: 'ตั้งค่า', icon: Settings },
];

export default function App() {
  const [project, setProject] = useState<NovelProject>(() => loadProject());
  const [settings, setSettings] = useState<AiSettings>(() => loadAiSettings());
  const [view, setView] = useState<AppView>('setup');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('พร้อมสร้างนิยายเรื่องใหม่');
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    saveAiSettings(settings);
  }, [settings]);

  const completedCount = useMemo(
    () => project.chapters.filter((chapter) => Boolean((chapter.mainText || chapter.draft).trim())).length,
    [project.chapters],
  );

  const totalChapters = project.chapters.length || project.idea.chapterCount;
  const progress = totalChapters ? Math.round((completedCount / totalChapters) * 100) : 0;

  async function createOutline() {
    setBusy(true);
    setError('');
    try {
      setStatus('AI กำลังตีความไอเดียและสร้างพล็อต 3 แนวทาง...');
      const pitchResult = await generatePitchOptions(project, undefined, settings);
      const selected = pitchResult.options[0];
      setStatus('AI กำลังสร้างโลก ตัวละคร และโครงตอน...');
      const bibleResult = await buildStoryBibleFromPitch(
        { ...project, pitches: pitchResult.options, selectedPitchId: selected.id },
        selected,
        settings,
      );
      setProject((current) => ({
        ...current,
        pitches: pitchResult.options,
        selectedPitchId: selected.id,
        bible: bibleResult.bible,
        chapters: bibleResult.chapters,
        currentChapterId: bibleResult.chapters[0]?.id ?? current.currentChapterId,
        jobs: [...current.jobs, pitchResult.job, bibleResult.job],
        updatedAt: new Date().toISOString(),
      }));
      setStatus('โครงนิยายพร้อมแล้ว เลือกแนวทางแล้วเริ่มเขียนทั้งเล่มได้เลย');
      setView('generate');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'สร้างโครงนิยายไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  async function generateWholeBook(overwrite = false) {
    if (!project.chapters.length) {
      setError('กรุณาสร้างโครงนิยายก่อน');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let workingProject = overwrite
        ? {
            ...project,
            chapters: project.chapters.map((chapter) => ({
              ...chapter,
              draft: '',
              mainText: '',
              status: 'planned' as const,
              canonUpdates: [],
              scenePlan: [],
              memory: undefined,
            })),
            bible: { ...project.bible, canonMemory: ['เริ่มเขียนต้นฉบับใหม่ด้วย Novel Engine V2'] },
            storyState: undefined,
            engineVersion: 2,
          }
        : project;
      if (overwrite) setProject(workingProject);
      for (let index = 0; index < workingProject.chapters.length; index += 1) {
        const chapter = workingProject.chapters[index];
        if ((chapter.mainText || chapter.draft).trim()) continue;
        setStatus(`AI กำลังเขียนตอนที่ ${chapter.number}/${workingProject.chapters.length}: ${chapter.title}`);
        const result = await draftChapter(workingProject, chapter, settings);
        const chapterWithPlan = { ...chapter, scenePlan: result.scenePlan };
        const memory = createChapterMemory(workingProject, chapterWithPlan, result.text);
        const updatedChapter = {
          ...chapterWithPlan,
          draft: result.text,
          mainText: result.text,
          status: 'main' as const,
          memory,
          canonUpdates: [
            ...summarizeCanonUpdate({ ...chapterWithPlan, mainText: result.text }),
            ...memory.newFacts,
            ...memory.relationshipChanges,
          ],
          updatedAt: new Date().toISOString(),
        };
        const chapters = workingProject.chapters.map((item) => item.id === chapter.id ? updatedChapter : item);
        const canonMemory = [
          ...workingProject.bible.canonMemory,
          ...updatedChapter.canonUpdates,
        ].slice(-20);
        workingProject = {
          ...workingProject,
          chapters,
          bible: { ...workingProject.bible, canonMemory },
          storyState: buildStoryState(workingProject, updatedChapter, memory),
          engineVersion: 2,
          jobs: [...workingProject.jobs, result.job],
          updatedAt: new Date().toISOString(),
        };
        setProject(workingProject);
      }
      setStatus('เขียนนิยายครบทั้งเล่มแล้ว พร้อมอ่านและดาวน์โหลด');
      setView('reader');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'AI เขียนนิยายไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  function choosePitch(pitch: PitchOption) {
    setProject((current) => ({ ...current, selectedPitchId: pitch.id }));
  }

  function resetProject() {
    if (!window.confirm('เริ่มนิยายเรื่องใหม่และล้างงานปัจจุบันใช่หรือไม่?')) return;
    setProject(createDefaultProject());
    setView('setup');
    setStatus('เริ่มโปรเจกต์ใหม่แล้ว');
  }

  function navigate(nextView: AppView) {
    setView(nextView);
    setMenuOpen(false);
  }

  return (
    <div className="studio-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="studio-header">
        <button className="mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="เปิดเมนู">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button className="studio-brand" onClick={() => navigate('setup')}>
          <span className="brand-symbol"><Sparkles size={21} /></span>
          <span><strong>Novel Studio</strong><small>AI co-author</small></span>
        </button>

        <nav className={menuOpen ? 'studio-nav open' : 'studio-nav'}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => navigate(id)}>
              <Icon size={17} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <span className="model-badge">
            {settings.operationMode === 'api'
              ? settings.provider === 'typhoon'
                ? appEnv.typhoonModel
                : settings.model
              : 'Mock AI'}
          </span>
          <button className="new-project-button" onClick={resetProject}><Plus size={17} />เรื่องใหม่</button>
        </div>
      </header>

      <main className="studio-main">
        <aside className="project-rail">
          <div className="project-cover">
            <div className="cover-moon" />
            <div className="cover-castle" />
            <span>กำลังเขียน</span>
            <strong>{project.title || 'นิยายเรื่องใหม่'}</strong>
          </div>
          <div className="progress-card">
            <div><span>ความคืบหน้า</span><strong>{progress}%</strong></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <small>{completedCount} จาก {totalChapters} ตอน</small>
          </div>
          <div className="quick-summary">
            <div><LibraryBig size={17} /><span>{project.idea.genres.slice(0, 2).join(' · ') || 'ยังไม่ได้เลือกแนว'}</span></div>
            <p>{project.idea.seedIdea || 'เริ่มจากเล่าไอเดียสั้น ๆ แล้วปล่อยให้ AI ช่วยต่อยอดทั้งเล่ม'}</p>
          </div>
        </aside>

        <section className="workspace">
          {view === 'setup' && (
            <SetupView project={project} onChange={setProject} onCreateOutline={createOutline} busy={busy} />
          )}
          {view === 'generate' && (
            <GenerateView
              project={project}
              onChoosePitch={choosePitch}
              onGenerate={() => generateWholeBook(false)}
              onRegenerate={() => generateWholeBook(true)}
              busy={busy}
              completedCount={completedCount}
            />
          )}
          {view === 'reader' && <ReaderView project={project} onChange={setProject} />}
          {view === 'export' && (
            <ExportView
              project={project}
              onDocx={() => downloadProjectDocx(project)}
              onMarkdown={() => downloadProjectMarkdown(project)}
              onJson={() => downloadProjectJson(project)}
            />
          )}
          {view === 'settings' && (
            <SettingsView settings={settings} onChange={setSettings} defaults={defaultAiSettings} />
          )}
        </section>
      </main>

      <footer className="studio-status">
        <span className={busy ? 'status-dot busy' : 'status-dot'} />
        <span>{status}</span>
        {error && <strong>{error}</strong>}
      </footer>
    </div>
  );
}
