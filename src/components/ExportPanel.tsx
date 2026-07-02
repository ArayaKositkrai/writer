import { 
  ArrowLeft, Check, Copy, Download, FileJson, FileText, PackageCheck, Save, 
  ChevronLeft, ChevronRight, Maximize2, Minimize2 
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  chapterToMarkdown,
  downloadChapterDocx,
  downloadChapterJson,
  downloadChapterMarkdown,
  downloadProjectDocx,
  downloadProjectJson,
  downloadProjectMarkdown,
} from '../services/exporter';
import { summarizeCanonUpdate } from '../services/aiService';
import { NovelProject, WorkflowStep, ChapterStatus } from '../types';

interface ExportPanelProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

const statusLabel: Record<ChapterStatus, string> = {
  planned: 'วางแผนแล้ว',
  drafting: 'กำลังเขียน',
  reviewing: 'รอตรวจ',
  needs_revision: 'ต้องแก้ไข',
  main: 'ตอนหลัก',
};

function ExportPanel({ project, updateProject, goToStep }: ExportPanelProps) {
  const currentChapter = project.chapters.find((chapter) => chapter.id === project.currentChapterId);
  const firstReadyChapter = currentChapter ?? project.chapters.find((chapter) => chapter.mainText || chapter.draft) ?? project.chapters[0];
  
  const [selectedChapterId, setSelectedChapterId] = useState(firstReadyChapter?.id ?? '');
  const [copied, setCopied] = useState(false);
  const [exportingDocx, setExportingDocx] = useState<string | null>(null);
  const [exportError, setExportError] = useState('');
  
  // State สำหรับ Pagination ของสารบัญ
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State สำหรับโหมดเต็มจอของ Markdown
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedChapter = project.chapters.find((chapter) => chapter.id === selectedChapterId) ?? firstReadyChapter;
  
  const markdown = useMemo(
    () => selectedChapter ? chapterToMarkdown(project, selectedChapter) : '',
    [project, selectedChapter],
  );
  
  const draftedChapters = project.chapters.filter((chapter) => (chapter.draft || chapter.mainText).trim()).length;
  const mainChapters = project.chapters.filter((chapter) => chapter.status === 'main').length;

  // คำนวณ Pagination
  const totalPages = Math.ceil(project.chapters.length / itemsPerPage);
  const paginatedChapters = project.chapters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function createDocx(key: string, task: () => Promise<void>) {
    setExportingDocx(key);
    setExportError('');
    try {
      await task();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'สร้างไฟล์ DOCX ไม่สำเร็จ');
    } finally {
      setExportingDocx(null);
    }
  }

  function saveChapterToSystem(chapter: NovelProject['chapters'][number]) {
    const text = chapter.draft || chapter.mainText;
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
    }), `บันทึกตอนที่ ${chapter.number} ลงระบบเรียบร้อย`);

    goToStep('board');
  }

  return (
    <div className="modern-export-wrapper">
      <div className="modern-export-card">
        
        <header className="export-header">
          <div className="header-title-group">
            <span className="step-badge">STEP 6</span>
            <PackageCheck className="header-icon" size={24} />
            <div>
              <h2>บันทึกและส่งออกรายตอน</h2>
              <p>เลือกตอนจากสารบัญ ตรวจเนื้อหา แล้วดาวน์โหลดหรือบันทึกเป็นตอนหลัก</p>
            </div>
          </div>
          <button type="button" className="secondary-button flow-back-button" onClick={() => goToStep('writer')}>
            <ArrowLeft size={16} /> กลับไป Step 5
          </button>
        </header>

        <div className="export-stats-row">
          <div className="stats-info">
            <strong>{draftedChapters}</strong> จาก {project.chapters.length} ตอนมีเนื้อหาร่าง 
            <span className="divider">•</span> 
            <strong>{mainChapters}</strong> ตอนบันทึกเป็นตอนหลักแล้ว
          </div>
          <div className="project-export-area">
            {exportError && <span className="export-error" role="alert">{exportError}</span>}
            <div className="project-export-actions">
              <button type="button" className="btn-outline" disabled={!draftedChapters || exportingDocx !== null} onClick={() => void createDocx('project', () => downloadProjectDocx(project))}>
                <FileText size={16} /> {exportingDocx === 'project' ? 'กำลังสร้าง...' : 'ต้นฉบับ .docx'}
              </button>
              <button type="button" className="btn-outline" disabled={!draftedChapters} onClick={() => downloadProjectMarkdown(project)}>
                <Download size={16} /> ทั้งเล่ม .md
              </button>
              <button type="button" className="btn-outline" onClick={() => downloadProjectJson(project)}>
                <FileJson size={16} /> สำรอง .json
              </button>
            </div>
          </div>
        </div>

        <div className="export-body-split">
          {/* Left Panel: Table of Contents (With Pagination) */}
          <aside className="toc-panel">
            <div className="toc-header">
              <h3>สารบัญโครงร่าง</h3>
              <p>คลิกเพื่อดูรายละเอียด</p>
            </div>
            
            <div className="toc-list">
              {paginatedChapters.map((chapter) => {
                const isActive = chapter.id === selectedChapter?.id;
                const hasContent = (chapter.mainText || chapter.draft).trim().length > 0;
                
                return (
                  <div 
                    key={chapter.id} 
                    className={`toc-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    title={`เรื่องย่อ: ${chapter.summary || 'ยังไม่มีสรุปย่อย'}`}
                  >
                    <div className="toc-item-top">
                      <span className="toc-chapter-num">ตอนที่ {chapter.number}</span>
                      <span className={`status-badge ${chapter.status}`}>{statusLabel[chapter.status]}</span>
                    </div>
                    
                    <strong className="toc-chapter-title">{chapter.title}</strong>
                  
                    </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="toc-pagination">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} /> ก่อนหน้า
                </button>
                <span>หน้า {currentPage} / {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป <ChevronRight size={16} />
                </button>
              </div>
            )}
          </aside>

          {/* Right Panel: Chapter Details */}
          <main className="detail-panel">
            {selectedChapter ? (
              <>
                <div className="detail-header">
                  <div className="detail-title-area">
                    <span className="chapter-label">ตอนที่ {selectedChapter.number}</span>
                    
                    {/* ย้ายปุ่มดาวน์โหลดมาต่อท้ายชื่อตอน */}
                    <div className="title-inline-row">
                      <h3>{selectedChapter.title}</h3>
                      <div className="inline-export-actions">
                        <button
                          className="borderless-text-btn"
                          disabled={!(selectedChapter.mainText || selectedChapter.draft).trim() || exportingDocx !== null}
                          onClick={() => void createDocx(selectedChapter.id, () => downloadChapterDocx(project, selectedChapter))}
                          title="ดาวน์โหลด Word DOCX"
                        >
                          <FileText size={14} /> <span>{exportingDocx === selectedChapter.id ? '...' : 'DOCX'}</span>
                        </button>
                        <button 
                          className="borderless-text-btn"
                          disabled={!(selectedChapter.mainText || selectedChapter.draft).trim()} 
                          onClick={() => downloadChapterMarkdown(project, selectedChapter)}
                          title="ดาวน์โหลด Markdown"
                        >
                          <Download size={14} /> <span>MD</span>
                        </button>
                        <button 
                          className="borderless-text-btn"
                          disabled={!(selectedChapter.mainText || selectedChapter.draft).trim()} 
                          onClick={() => downloadChapterJson(project, selectedChapter)}
                          title="ดาวน์โหลด JSON"
                        >
                          <FileJson size={14} /> <span>JSON</span>
                        </button>
                      </div>
                    </div>
                    
                    <p className="chapter-summary">{selectedChapter.summary || 'ยังไม่มีสรุปย่อยสำหรับตอนนี้'}</p>
                  </div>
                  
                  <div className="detail-action-area">
                    <button 
                      type="button" 
                      className="btn-primary save-btn" 
                      disabled={!(selectedChapter.mainText || selectedChapter.draft).trim()} 
                      onClick={() => saveChapterToSystem(selectedChapter)}
                    >
                      <Save size={16} /> บันทึกตอนลงระบบ
                    </button>
                  </div>
                </div>

                <div className="outline-cards-grid">
                  <div className="outline-card">
                    <h4>เป้าหมาย</h4>
                    <p>{selectedChapter.goal}</p>
                  </div>
                  <div className="outline-card">
                    <h4>ความขัดแย้ง</h4>
                    <p>{selectedChapter.conflict}</p>
                  </div>
                  <div className="outline-card">
                    <h4>ผลลัพธ์</h4>
                    <p>{selectedChapter.outcome}</p>
                  </div>
                  <div className="outline-card">
                    <h4>จุดทิ้งท้าย (Cliffhanger)</h4>
                    <p>{selectedChapter.cliffhanger}</p>
                  </div>
                </div>

                {/* Markdown Preview Section */}
                <div className={`markdown-preview-section ${isFullscreen ? 'fullscreen-mode' : ''}`}>
                  <div className="preview-header">
                    <div>
                      <h3>ตัวอย่างไฟล์ Markdown</h3>
                      <p>ไฟล์นี้มีเฉพาะโครงและต้นฉบับของตอนที่เลือก (สามารถยืดกล่องอ่านได้)</p>
                    </div>
                    <div className="preview-header-actions">
                      <button type="button" className="btn-secondary copy-btn" onClick={copyMarkdown}>
                        {copied ? <Check size={14} /> : <Copy size={14} />} 
                        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-outline expand-btn" 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}
                      >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </button>
                    </div>
                  </div>
                  <textarea 
                    className="markdown-textarea" 
                    readOnly 
                    value={markdown} 
                    aria-label="ตัวอย่าง Markdown รายตอน" 
                  />
                </div>
              </>
            ) : (
              <div className="empty-detail-state">
                <FileText size={32} className="empty-icon" />
                <h3>ยังไม่มีตอนให้ส่งออก</h3>
                <p>โปรดกลับไปกำหนดตอนใน Idea Base และวางโครงเรื่องก่อน</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        .modern-export-wrapper {
          height: 100%; width: 100%; padding: 4px; display: flex; flex-direction: column;
        }

        .modern-export-card {
          flex: 1; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); display: flex; flex-direction: column; overflow: hidden;
        }

        /* Header & Stats */
        .export-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #f3f4f6; }
        .header-title-group { display: flex; align-items: center; gap: 12px; }
        .step-badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; }
        .header-icon { color: #6366f1; }
        .export-header h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #1f2937; }
        .export-header p { margin: 2px 0 0; font-size: 0.85rem; color: #6b7280; }

        .export-stats-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 24px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .stats-info { font-size: 0.85rem; color: #4b5563; }
        .stats-info strong { color: #111827; }
        .divider { margin: 0 8px; color: #d1d5db; }
        .project-export-area { display: grid; justify-items: end; gap: 5px; }
        .project-export-actions { display: flex; align-items: center; gap: 6px; }
        .project-export-actions button { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
        .project-export-actions button:disabled { cursor: not-allowed; opacity: 0.5; }
        .export-error { max-width: 520px; color: #b91c1c; font-size: 0.75rem; text-align: right; }

        .export-body-split { flex: 1; display: flex; overflow: hidden; }

        /* Left Panel: TOC */
        .toc-panel { width: 320px; background: #ffffff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
        .toc-header { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
        .toc-header h3 { margin: 0; font-size: 0.95rem; color: #1f2937; }
        .toc-header p { margin: 2px 0 0; font-size: 0.75rem; color: #6b7280; }
        
        .toc-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        
        .toc-item { display: flex; flex-direction: column; padding: 12px 14px; border-radius: 8px; background: #ffffff; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; position: relative; }
        .toc-item:hover { background: #f9fafb; border-color: #e5e7eb; }
        .toc-item.active { background: #eef2ff; border-color: #c7d2fe; }
        
        .toc-item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .toc-chapter-num { font-size: 0.75rem; font-weight: 700; color: #6b7280; }
        .toc-item.active .toc-chapter-num { color: #4f46e5; }
        
        .toc-chapter-title { font-size: 0.9rem; color: #1f2937; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        
        .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: 700; margin: 0; display: inline-block; line-height: 1; }
        .status-badge.planned { background: #f3f4f6; color: #6b7280; }
        .status-badge.drafting { background: #dbeafe; color: #4338ca; }
        .status-badge.reviewing { background: #fef3c7; color: #b45309; }
        .status-badge.needs_revision { background: #fee2e2; color: #b91c1c; }
        .status-badge.main { background: #dcfce7; color: #15803d; }

        /* ปรับปุ่มลบกรอบ/พื้นหลัง */
        .toc-item-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; opacity: 0; transition: opacity 0.2s; }
        .toc-item:hover .toc-item-actions, .toc-item.active .toc-item-actions { opacity: 1; }
        .borderless-btn { background: transparent; border: none; color: #9ca3af; padding: 4px; border-radius: 4px; cursor: pointer; display: grid; place-items: center; }
        .borderless-btn:hover:not(:disabled) { color: #4f46e5; background: #e0e7ff; }
        .borderless-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Pagination */
        .toc-pagination { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f3f4f6; font-size: 0.8rem; color: #4b5563; }
        .toc-pagination button { display: flex; align-items: center; gap: 4px; background: transparent; border: none; color: #4f46e5; font-weight: 600; cursor: pointer; }
        .toc-pagination button:disabled { color: #9ca3af; cursor: not-allowed; }

        /* Right Panel */
        .detail-panel { flex: 1; overflow-y: auto; padding: 24px 32px; background: #ffffff; display: flex; flex-direction: column; gap: 24px; position: relative; }
        
        .detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .detail-title-area { flex: 1; }
        .chapter-label { font-size: 0.8rem; font-weight: 700; color: #6366f1; text-transform: uppercase; }
        
        /* แถวชื่อเรื่อง + ปุ่ม Export โปร่งใส */
        .title-inline-row { display: flex; align-items: center; gap: 16px; margin: 4px 0 8px; }
        .title-inline-row h3 { margin: 0; font-size: 1.3rem; color: #111827; }
        .inline-export-actions { display: flex; align-items: center; gap: 8px; }
        .borderless-text-btn { display: flex; align-items: center; gap: 4px; background: transparent; border: none; color: #6b7280; font-size: 0.75rem; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .borderless-text-btn:hover:not(:disabled) { color: #4f46e5; background: #f3f4f6; }
        .borderless-text-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .chapter-summary { margin: 0; font-size: 0.9rem; color: #4b5563; line-height: 1.6; }
        .detail-action-area { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }

        .outline-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .outline-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .outline-card h4 { margin: 0 0 6px; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; }
        .outline-card p { margin: 0; font-size: 0.85rem; color: #1f2937; line-height: 1.5; }

        /* Markdown Preview & Fullscreen */
        .markdown-preview-section { flex: 1; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s ease; }
        
        /* สไตล์ตอนขยายเต็มจอ */
        .markdown-preview-section.fullscreen-mode {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: #fff; z-index: 100; padding: 24px;
          border-radius: 12px; box-shadow: 0 0 0 100vw rgba(0,0,0,0.5); /* ทำฉากหลังมืด */
        }
        
        .preview-header { display: flex; justify-content: space-between; align-items: flex-end; }
        .preview-header h3 { margin: 0 0 4px; font-size: 1rem; color: #111827; }
        .preview-header p { margin: 0; font-size: 0.8rem; color: #6b7280; }
        .preview-header-actions { display: flex; gap: 8px; align-items: center; }
        
        .markdown-textarea {
          flex: 1; min-height: 250px; padding: 16px; background: #f9fafb;
          border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'Noto Sans Thai', monospace;
          font-size: 0.85rem; line-height: 1.6; color: #374151;
          resize: vertical; /* อนุญาตให้ยืดแนวตั้งได้ */
          outline: none;
        }
        .markdown-textarea:focus { border-color: #c7d2fe; background: #ffffff; }
        
        /* ล็อกไม่ให้ยืดตอนอยู่โหมดเต็มจอ ไม่งั้นจะล้น */
        .fullscreen-mode .markdown-textarea { height: 100%; resize: none; }

        .btn-primary, .btn-secondary, .btn-outline {
          display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
        }
        .btn-primary { background: #6366f1; color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }
        .btn-secondary { background: #f3f4f6; color: #374151; padding: 6px 10px; font-size: 0.75rem; }
        .btn-secondary:hover { background: #e5e7eb; color: #111827; }
        .btn-outline { background: #fff; border: 1px solid #d1d5db; color: #374151; }
        .btn-outline:hover { background: #f9fafb; color: #111827; }
        .save-btn { padding: 10px 16px; font-size: 0.9rem; }
        .expand-btn { padding: 6px; }

        .empty-detail-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #6b7280; }
        .empty-icon { color: #d1d5db; margin-bottom: 16px; }
        .empty-detail-state h3 { margin: 0 0 8px; color: #111827; font-size: 1.2rem; }
        .empty-detail-state p { margin: 0; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}

export default ExportPanel;
