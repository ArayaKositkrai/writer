import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, CircleAlert, Copy, Download, FileJson, FilePenLine, ScanText, Sparkles, WandSparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { draftChapter, reviewChapter, reviseChapterFromReviews } from '../services/aiService';
import { downloadChapterJson, downloadChapterMarkdown } from '../services/exporter';
import { AiSettings, ChapterPlan, NovelProject, ReviewItem, WorkflowStep } from '../types';

interface ChapterWriterProps {
  project: NovelProject;
  chapter: ChapterPlan;
  aiSettings: AiSettings;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
  onNotice: (notice: string) => void;
}

type WriterTab = 'brief' | 'draft' | 'summary' | 'quality' | 'final';
type BriefField = keyof Pick<ChapterPlan, 'title' | 'summary' | 'goal' | 'conflict' | 'outcome' | 'cliffhanger'>;

function getInitialTab(chapter: ChapterPlan): WriterTab {
  if (chapter.status === 'main' && chapter.mainText.trim()) return 'final';
  if (chapter.status === 'reviewing') return 'summary';
  if ((chapter.draft || chapter.mainText).trim()) return 'draft';
  return 'brief';
}

function ChapterWriter({ project, chapter, aiSettings, updateProject, goToStep, onNotice }: ChapterWriterProps) {
  const text = chapter.status === 'main' ? chapter.mainText || chapter.draft : chapter.draft || chapter.mainText;
  const hasText = Boolean(text.trim());
  const [activeTab, setActiveTab] = useState<WriterTab>(() => getInitialTab(chapter));
  const [briefApproved, setBriefApproved] = useState(hasText);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const chapterIndex = project.chapters.findIndex((item) => item.id === chapter.id);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const reviews = project.reviews[chapter.id] ?? [];

  useEffect(() => {
    setActiveTab(getInitialTab(chapter));
    setBriefApproved(Boolean((chapter.draft || chapter.mainText).trim()));
  }, [chapter.id]);

  function updateChapter(field: BriefField | 'draft', value: string) {
    updateProject((current) => ({
      ...current,
      chapters: current.chapters.map((item) =>
        item.id === chapter.id
          ? { ...item, [field]: value, status: field === 'draft' ? 'drafting' : item.status, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
  }

  function moveToChapter(offset: number) {
    const nextChapter = project.chapters[chapterIndex + offset];
    if (!nextChapter) return;
    updateProject((current) => ({ ...current, currentChapterId: nextChapter.id }));
  }

  async function handleDraft() {
    setIsDrafting(true);
    try {
      const { text: draft, job } = await draftChapter(project, chapter, aiSettings);
      updateProject(
        (current) => ({
          ...current,
          chapters: current.chapters.map((item) =>
            item.id === chapter.id ? { ...item, draft, status: 'drafting', updatedAt: new Date().toISOString() } : item,
          ),
          jobs: [...current.jobs, job],
        }),
        `AI เขียนร่างตอนที่ ${chapter.number} แล้ว`,
      );
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'เขียนร่างไม่สำเร็จ');
    } finally {
      setIsDrafting(false);
    }
  }

  function approveBrief() {
    if (!briefApproved) return;
    setActiveTab('draft');
  }

  async function runQualityReview() {
    if (!hasText) return;
    setIsReviewing(true);
    setSelectedIssueIds([]);
    try {
      const { items, job } = await reviewChapter(project, chapter, aiSettings);
      updateProject((current) => ({
        ...current,
        chapters: current.chapters.map((item) => item.id === chapter.id ? { ...item, status: 'reviewing' } : item),
        reviews: { ...current.reviews, [chapter.id]: items },
        jobs: [...current.jobs, job],
      }), `ตรวจคุณภาพตอนที่ ${chapter.number} แล้ว`);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'ตรวจคุณภาพไม่สำเร็จ');
    } finally {
      setIsReviewing(false);
    }
  }

  function toggleIssue(id: string) {
    setSelectedIssueIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function confirmSelectedFixes() {
    const selectedReviews = reviews.filter((item) => selectedIssueIds.includes(item.id));
    if (!selectedReviews.length) return;
    setIsApplyingFixes(true);
    try {
      const { text: revisedText, job } = await reviseChapterFromReviews(project, chapter, selectedReviews, aiSettings);
      updateProject((current) => ({
        ...current,
        chapters: current.chapters.map((item) =>
          item.id === chapter.id ? { ...item, draft: revisedText, status: 'reviewing', updatedAt: new Date().toISOString() } : item,
        ),
        reviews: {
          ...current.reviews,
          [chapter.id]: (current.reviews[chapter.id] ?? []).map((item) =>
            selectedIssueIds.includes(item.id) ? { ...item, resolved: true } : item,
          ),
        },
        jobs: [...current.jobs, job],
      }), `AI แก้ไข ${selectedReviews.length} ประเด็นแล้ว`);
      goToStep('export');
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'แก้ไขต้นฉบับไม่สำเร็จ');
    } finally {
      setIsApplyingFixes(false);
    }
  }

  function continueWithoutFixes() {
    updateProject((current) => ({
      ...current,
      chapters: current.chapters.map((item) => item.id === chapter.id ? { ...item, status: 'reviewing' } : item),
    }));
    goToStep('export');
  }

  async function copyFinalText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 1800);
    } catch {
      setCopiedText(false);
    }
  }

  return (
    <div className="writer-step-wrapper">
      <div className="writer-step-card">
        <header className="writer-step-header">
          <div className="writer-header-title">
            <span className="step-badge">STEP 5</span>
            <FilePenLine className="writer-header-icon" size={22} />
            <div>
              <h2>ตอนที่ {chapter.number}: {chapter.title}</h2>
              <p>ทำตามลำดับ Brief → ร่าง → ตรวจคุณภาพ → ดูภาพรวมก่อนบันทึก</p>
            </div>
          </div>
          <div className="writer-header-actions">
            {/* <button type="button" className="secondary-button flow-back-button" onClick={() => goToStep('board')}>
              <ArrowLeft size={17} /> กลับไปเลือกตอน Step 4
            </button> */}
            <div className="writer-chapter-nav">
              <button type="button" className="icon-button" onClick={() => moveToChapter(-1)} disabled={chapterIndex <= 0} aria-label="ตอนก่อนหน้า"><ChevronLeft size={18} /></button>
              <span>{chapter.number} / {project.chapters.length}</span>
              <button type="button" className="icon-button" onClick={() => moveToChapter(1)} disabled={chapterIndex >= project.chapters.length - 1} aria-label="ตอนถัดไป"><ChevronRight size={18} /></button>
            </div>
          </div>
        </header>

        <div className="writer-step-body">
          <nav className="writer-flow writer-tab-nav" aria-label="ขั้นตอนการทำงานใน Step 5">
            <button type="button" className={activeTab === 'brief' ? 'active' : briefApproved ? 'done' : ''} onClick={() => setActiveTab('brief')}>
              <b>1</b><span>ตรวจ Brief</span>
            </button>
            <button type="button" className={activeTab === 'draft' ? 'active' : hasText ? 'done' : ''} disabled={!briefApproved} onClick={() => setActiveTab('draft')}>
              <b>2</b><span>เขียนร่าง</span>
            </button>
            <button type="button" className={activeTab === 'summary' ? 'active' : chapter.status === 'reviewing' || chapter.status === 'main' ? 'done' : ''} disabled={!hasText} onClick={() => setActiveTab('summary')}>
              <b>3</b><span>ภาพรวมก่อนบันทึก</span>
            </button>
            <button type="button" className={activeTab === 'quality' ? 'active' : chapter.status === 'reviewing' || chapter.status === 'main' ? 'done' : ''} disabled={!hasText} onClick={() => setActiveTab('quality')}>
              <b>4</b><span>ตรวจคุณภาพ</span>
            </button>
            <button type="button" className={activeTab === 'final' ? 'active' : chapter.status === 'main' ? 'done' : ''} disabled={chapter.status !== 'main' || !chapter.mainText.trim()} onClick={() => setActiveTab('final')}>
              <b>5</b><span>เนื้อหาสมบูรณ์</span>
            </button>
          </nav>

          <div className="writer-tab-content">
            {activeTab === 'brief' && (
              <section className="writer-brief-review">
                <div className="writer-tab-heading">
                  <div><h3>1. ตรวจ Brief ของตอน</h3><p>อ่านและแก้ข้อมูลให้ครบ แล้วติ๊กยืนยันก่อนเริ่มเขียนร่าง</p></div>
                </div>
                <div className="writer-brief-review-grid">
                  <label className="wide">ชื่อตอน<input value={chapter.title} onChange={(event) => updateChapter('title', event.target.value)} /></label>
                  <label className="wide">เรื่องย่อ<textarea rows={4} value={chapter.summary} onChange={(event) => updateChapter('summary', event.target.value)} /></label>
                  <label>เป้าหมาย<textarea rows={3} value={chapter.goal} onChange={(event) => updateChapter('goal', event.target.value)} /></label>
                  <label>ความขัดแย้ง<textarea rows={3} value={chapter.conflict} onChange={(event) => updateChapter('conflict', event.target.value)} /></label>
                  <label>ผลลัพธ์<textarea rows={3} value={chapter.outcome} onChange={(event) => updateChapter('outcome', event.target.value)} /></label>
                  <label>Cliffhanger<textarea rows={3} value={chapter.cliffhanger} onChange={(event) => updateChapter('cliffhanger', event.target.value)} /></label>
                </div>
                <div className="writer-brief-confirm">
                  <label><input type="checkbox" checked={briefApproved} onChange={(event) => setBriefApproved(event.target.checked)} /> ฉันตรวจ Brief แล้ว ข้อมูลพร้อมสำหรับเขียนร่าง</label>
                  <button type="button" className="accent-button" disabled={!briefApproved} onClick={approveBrief}>ไปเขียนร่าง <ArrowRight size={17} /></button>
                </div>
              </section>
            )}

            {activeTab === 'draft' && (
              <section className="writer-editor-panel writer-draft-tab">
                <div className="writer-editor-toolbar">
                  <div><h3>2. เขียนร่าง</h3><span>{wordCount.toLocaleString('th-TH')} คำ · แก้ไขข้อความได้โดยตรง</span></div>
                  <button type="button" className="accent-button writer-ai-draft-button" onClick={handleDraft} disabled={isDrafting}>
                    <WandSparkles size={17} /> {isDrafting ? 'AI กำลังเขียน...' : 'ให้ AI เขียนร่าง'}
                  </button>
                </div>
                <textarea className="writer-manuscript" value={text} onChange={(event) => updateChapter('draft', event.target.value)} placeholder="กด “ให้ AI เขียนร่าง” เพื่อสร้างเนื้อหาจาก Brief..." />
                <footer className="writer-editor-footer writer-draft-footer">
                  <span>ตรวจร่างให้เรียบร้อย แล้วส่งไปตรวจคุณภาพ</span>
                  <button type="button" className="accent-button" onClick={() => setActiveTab('quality')} disabled={!hasText}>
                    <ScanText size={17} /> ไปตรวจคุณภาพ
                  </button>
                </footer>
              </section>
            )}

            {activeTab === 'summary' && (
              <section className="writer-summary-tab">
                <div className="writer-tab-heading">
                  <div><h3>3. ภาพรวมตอนก่อนบันทึก</h3><p>ตรวจโครงและเนื้อหาฉบับล่าสุด หลังผ่านการตรวจคุณภาพแล้ว</p></div>
                  <span className="status-badge reviewing">ตรวจคุณภาพแล้ว</span>
                </div>
                <dl className="writer-summary-outline">
                  <div><dt>เรื่องย่อ</dt><dd>{chapter.summary}</dd></div>
                  <div><dt>เป้าหมาย</dt><dd>{chapter.goal}</dd></div>
                  <div><dt>ความขัดแย้ง</dt><dd>{chapter.conflict}</dd></div>
                  <div><dt>ผลลัพธ์และจุดทิ้งท้าย</dt><dd>{chapter.outcome}<br />{chapter.cliffhanger}</dd></div>
                </dl>
                <div className="writer-summary-manuscript"><h4>ต้นฉบับล่าสุด · {wordCount.toLocaleString('th-TH')} คำ</h4><div>{text || 'ยังไม่มีต้นฉบับ'}</div></div>
                <div className="writer-summary-actions">
                  <button type="button" className="secondary-button" onClick={() => setActiveTab('draft')}><ArrowLeft size={17} /> กลับไปดูร่าง</button>
                  <button type="button" className="accent-button" onClick={() => setActiveTab('quality')}>ไปตรวจคุณภาพ <ArrowRight size={17} /></button>
                </div>
              </section>
            )}

            {activeTab === 'quality' && (
              <section className="writer-quality-tab">
                <div className="writer-tab-heading">
                  <div><h3>4. ตรวจคุณภาพ</h3><p>ตรวจร่าง เลือกประเด็นที่ต้องการให้ AI แก้ได้หลายรายการ แล้วกดยืนยัน</p></div>
                  <button type="button" className="accent-button writer-quality-run" onClick={runQualityReview} disabled={isReviewing}>
                    <ScanText size={17} /> {isReviewing ? 'กำลังตรวจ...' : reviews.length ? 'ตรวจใหม่' : 'เริ่มตรวจคุณภาพ'}
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <div className="writer-quality-empty"><ScanText size={24} /><div><h3>ร่างพร้อมตรวจ</h3><p>กด “เริ่มตรวจคุณภาพ” เพื่อแสดงรายการที่ควรแก้</p></div></div>
                ) : (
                  <>
                    <div className="writer-quality-list">
                      {reviews.map((item: ReviewItem) => {
                        const selected = selectedIssueIds.includes(item.id);
                        return (
                          <article key={item.id} className={selected ? 'writer-quality-item selected' : 'writer-quality-item'}>
                            <div className="writer-quality-meta"><span>{item.area}</span><span className={`severity ${item.severity}`}>{item.severity}</span></div>
                            <h3>{item.title}</h3>
                            <p>{item.detail}</p>
                            <div><strong>AI จะแก้:</strong> {item.suggestion}</div>
                            <button type="button" className="secondary-button" onClick={() => toggleIssue(item.id)}>
                              {selected ? <Check size={16} /> : <CircleAlert size={16} />} {selected ? 'เลือกให้แก้แล้ว' : 'แก้เนื้อหาส่วนนี้'}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                    <div className="writer-quality-confirm">
                      <div><strong>เลือกแล้ว {selectedIssueIds.length} รายการ</strong><span>ยืนยันแล้วระบบจะไป Step 6 เพื่อบันทึกตอน</span></div>
                      <div>
                        <button type="button" className="secondary-button" onClick={continueWithoutFixes}>ไม่แก้ ใช้ร่างเดิม</button>
                        <button type="button" className="accent-button" onClick={confirmSelectedFixes} disabled={!selectedIssueIds.length || isApplyingFixes}>
                          <Sparkles size={17} /> {isApplyingFixes ? 'กำลังแก้...' : 'ยืนยันให้ AI แก้'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

            {activeTab === 'final' && (
              <section className="writer-final-tab">
                <div className="writer-final-heading">
                  <div>
                    <span className="status-badge main">ตอนหลัก</span>
                    <h3>ตอนที่ {chapter.number}: {chapter.title}</h3>
                    <p>เนื้อหาฉบับสมบูรณ์ที่บันทึกจาก Step 6 · {wordCount.toLocaleString('th-TH')} คำ</p>
                  </div>
                  <div className="writer-final-actions" aria-label="ดาวน์โหลดและคัดลอกเนื้อหาสมบูรณ์">
                    <button type="button" className="secondary-button" onClick={() => downloadChapterMarkdown(project, chapter)}>
                      <Download size={16} /> Markdown
                    </button>
                    <button type="button" className="secondary-button" onClick={() => downloadChapterJson(project, chapter)}>
                      <FileJson size={16} /> JSON
                    </button>
                    <button type="button" className="accent-button" onClick={copyFinalText}>
                      {copiedText ? <Check size={16} /> : <Copy size={16} />} Text
                    </button>
                  </div>
                </div>
                <article className="writer-final-manuscript">{text}</article>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChapterWriter;
