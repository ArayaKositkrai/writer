import { ArrowLeft, Check, Copy, Download, FileJson, FileText, PackageCheck, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  chapterToMarkdown,
  downloadChapterJson,
  downloadChapterMarkdown,
  downloadProjectJson,
} from '../services/exporter';
import { summarizeCanonUpdate } from '../services/aiService';
import { NovelProject, WorkflowStep } from '../types';

interface ExportPanelProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function ExportPanel({ project, updateProject, goToStep }: ExportPanelProps) {
  const currentChapter = project.chapters.find((chapter) => chapter.id === project.currentChapterId);
  const firstReadyChapter = currentChapter ?? project.chapters.find((chapter) => chapter.mainText || chapter.draft) ?? project.chapters[0];
  const [selectedChapterId, setSelectedChapterId] = useState(firstReadyChapter?.id ?? '');
  const [copied, setCopied] = useState(false);
  const selectedChapter = project.chapters.find((chapter) => chapter.id === selectedChapterId) ?? firstReadyChapter;
  const markdown = useMemo(
    () => selectedChapter ? chapterToMarkdown(project, selectedChapter) : '',
    [project, selectedChapter],
  );
  const draftedChapters = project.chapters.filter((chapter) => (chapter.draft || chapter.mainText).trim()).length;
  const mainChapters = project.chapters.filter((chapter) => chapter.status === 'main').length;

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function saveChapterToSystem(chapter: NovelProject['chapters'][number]) {
    const text = chapter.mainText || chapter.draft;
    if (!text.trim()) return;
    const canonUpdates = summarizeCanonUpdate(chapter);

    updateProject((current) => ({
      ...current,
      bible: {
        ...current.bible,
        canonMemory: Array.from(new Set([
          ...current.bible.canonMemory.filter((item) => item !== 'ยังไม่มีตอนที่บันทึกเป็นตอนหลัก'),
          ...canonUpdates,
        ])),
      },
      chapters: current.chapters.map((item) =>
        item.id === chapter.id
          ? { ...item, draft: text, mainText: text, status: 'main', canonUpdates, updatedAt: new Date().toISOString() }
          : item,
      ),
    }), `บันทึกตอนที่ ${chapter.number} ลง Chapter Board แล้ว`);

  }

  return (
    <div className="export-step-wrapper">
      <div className="export-step-card">
        <header className="export-step-header">
          <div className="export-header-title">
            <span className="step-badge">STEP 6</span>
            <PackageCheck className="export-header-icon" size={22} />
            <div>
              <h2>บันทึกและส่งออกรายตอน</h2>
              <p>เลือกตอนจากสารบัญ ตรวจเนื้อหา แล้วดาวน์โหลดตอนนั้นเป็น Markdown หรือ JSON</p>
            </div>
          </div>
          <button type="button" className="secondary-button flow-back-button" onClick={() => goToStep('writer')}>
            <ArrowLeft size={17} /> กลับไป Step 5: จัดการตอน
          </button>
        </header>

        <div className="export-step-body">
          <section className="export-simple-status">
            <p><strong>{draftedChapters}</strong> จาก {project.chapters.length} ตอนมีเนื้อหา · <strong>{mainChapters}</strong> ตอนบันทึกเป็นตอนหลักแล้ว</p>
            <button type="button" className="secondary-button" onClick={() => downloadProjectJson(project)}>
              <FileJson size={17} /> สำรองโปรเจกต์ทั้งเรื่อง
            </button>
          </section>

          <div className="export-chapter-layout">
            <aside className="export-toc-panel" aria-labelledby="export-toc-title">
              <div className="export-toc-heading">
                <h3 id="export-toc-title">สารบัญโครงร่าง</h3>
                <p>เลือกตอนเพื่อดูรายละเอียด หรือกดไอคอนเพื่อบันทึกรายตอนได้ทันที</p>
              </div>
              <div className="export-toc-list">
                {project.chapters.map((chapter) => (
                  <div key={chapter.id} className={chapter.id === selectedChapter?.id ? 'export-chapter-row selected' : 'export-chapter-row'}>
                    <button type="button" className="export-chapter-select" onClick={() => setSelectedChapterId(chapter.id)}>
                      <span>ตอน {chapter.number}</span>
                      <strong>{chapter.title}</strong>
                      <small>{chapter.summary || 'ยังไม่มีสรุปย่อย'}</small>
                    </button>
                    <div className="export-row-actions">
                      <button type="button" disabled={!(chapter.mainText || chapter.draft).trim()} onClick={() => downloadChapterMarkdown(project, chapter)} aria-label={`ดาวน์โหลดตอนที่ ${chapter.number} เป็น Markdown`} title="ดาวน์โหลด Markdown"><FileText size={16} /></button>
                      <button type="button" disabled={!(chapter.mainText || chapter.draft).trim()} onClick={() => downloadChapterJson(project, chapter)} aria-label={`ดาวน์โหลดตอนที่ ${chapter.number} เป็น JSON`} title="ดาวน์โหลด JSON"><FileJson size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="export-chapter-detail">
              {selectedChapter ? (
                <>
                  <div className="export-detail-heading">
                    <div>
                      <span>ตอนที่ {selectedChapter.number}</span>
                      <h3>{selectedChapter.title}</h3>
                      <p>{selectedChapter.summary || 'ยังไม่มีสรุปย่อยสำหรับตอนนี้'}</p>
                    </div>
                    <div className="export-detail-actions">
                      <button type="button" className="accent-button export-system-save" disabled={!(selectedChapter.mainText || selectedChapter.draft).trim()} onClick={() => saveChapterToSystem(selectedChapter)}><Save size={17} /> บันทึกตอนลงระบบ</button>
                      <button type="button" className="secondary-button" disabled={!(selectedChapter.mainText || selectedChapter.draft).trim()} onClick={() => downloadChapterJson(project, selectedChapter)}><FileJson size={17} /> JSON</button>
                      <button type="button" className="secondary-button" disabled={!(selectedChapter.mainText || selectedChapter.draft).trim()} onClick={() => downloadChapterMarkdown(project, selectedChapter)}><Download size={17} /> Markdown</button>
                    </div>
                  </div>

                  <dl className="export-outline-detail">
                    <div><dt>เป้าหมาย</dt><dd>{selectedChapter.goal}</dd></div>
                    <div><dt>ความขัดแย้ง</dt><dd>{selectedChapter.conflict}</dd></div>
                    <div><dt>ผลลัพธ์</dt><dd>{selectedChapter.outcome}</dd></div>
                    <div><dt>จุดทิ้งท้าย</dt><dd>{selectedChapter.cliffhanger}</dd></div>
                  </dl>

                  <div className="export-preview-heading">
                    <div><h3>ตัวอย่างไฟล์ Markdown</h3><p>ไฟล์นี้มีเฉพาะโครงและต้นฉบับของตอนที่เลือก</p></div>
                    <button type="button" className="secondary-button export-copy-button" onClick={copyMarkdown}>
                      {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                  <textarea className="export-markdown-preview" readOnly value={markdown} aria-label="ตัวอย่าง Markdown รายตอน" />
                </>
              ) : (
                <div className="quality-empty"><FileText size={24} /><div><h3>ยังไม่มีตอนให้ส่งออก</h3><p>กลับไปกำหนดจำนวนตอนใน Idea Base ก่อน</p></div></div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportPanel;
