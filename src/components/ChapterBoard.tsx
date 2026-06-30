import { ArrowLeft, Edit3, LayoutGrid, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createChapter } from '../data/defaultProject';
import { ChapterPlan, ChapterStatus, NovelProject, WorkflowStep } from '../types';

interface ChapterBoardProps {
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

const statusOptions: Array<{ value: 'all' | ChapterStatus; label: string }> = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'planned', label: 'วางแผนแล้ว' },
  { value: 'drafting', label: 'กำลังเขียน' },
  { value: 'reviewing', label: 'รอตรวจ' },
  { value: 'needs_revision', label: 'ต้องแก้ไข' },
  { value: 'main', label: 'ตอนหลัก' },
];

function getTargetChapterCount(project: NovelProject) {
  const rawRange = (project.idea as NovelProject['idea'] & { chapterCountStr?: string }).chapterCountStr;
  const rangeCount = rawRange?.match(/\d+/)?.[0];
  return Math.max(1, rangeCount ? Number(rangeCount) : project.idea.chapterCount || 1);
}

function resizeChapters(chapters: ChapterPlan[], targetCount: number) {
  const existingByNumber = new Map(chapters.map((chapter) => [chapter.number, chapter]));
  return Array.from({ length: targetCount }, (_, index) => existingByNumber.get(index + 1) ?? createChapter(index + 1));
}

function ChapterBoard({ project, updateProject, goToStep }: ChapterBoardProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ChapterStatus>('all');
  const targetChapterCount = getTargetChapterCount(project);

  useEffect(() => {
    if (project.chapters.length === targetChapterCount && project.idea.chapterCount === targetChapterCount) return;

    updateProject((current) => {
      const nextChapters = resizeChapters(current.chapters, targetChapterCount);
      const currentChapterStillExists = nextChapters.some((chapter) => chapter.id === current.currentChapterId);
      return {
        ...current,
        idea: { ...current.idea, chapterCount: targetChapterCount },
        chapters: nextChapters,
        currentChapterId: currentChapterStillExists ? current.currentChapterId : nextChapters[0].id,
      };
    }, `ปรับจำนวนตอนเป็น ${targetChapterCount} ตอนตาม Idea Base แล้ว`);
  }, [project.chapters.length, project.idea.chapterCount, project.id, targetChapterCount, updateProject]);

  const filteredChapters = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('th');
    return project.chapters.filter((chapter) => {
      const matchesStatus = statusFilter === 'all' || chapter.status === statusFilter;
      const matchesQuery = !normalizedQuery ||
        `${chapter.number} ${chapter.title} ${chapter.summary}`.toLocaleLowerCase('th').includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [project.chapters, query, statusFilter]);

  function openChapter(chapterId: string) {
    updateProject((current) => ({ ...current, currentChapterId: chapterId }));
    goToStep('writer');
  }

  return (
    <div className="board-step-wrapper">
      <div className="board-step-card">
        <header className="board-step-header">
          <div className="board-header-title">
            <span className="step-badge">STEP 4</span>
            <LayoutGrid className="board-header-icon" size={22} />
            <div>
              <h2>Chapter Board</h2>
              <p>จัดการโครงตอนทั้งหมดและเลือกตอนที่ต้องการนำไปเขียน</p>
            </div>
          </div>
          <div className="board-header-actions">
            {/* <button type="button" className="secondary-button flow-back-button" onClick={() => goToStep('bible')}>
              <ArrowLeft size={17} /> กลับไป Step 3: โครงทั้งเรื่อง
            </button> */}
            <div className="board-count-badge">
              <strong>{project.chapters.length}</strong>
              <span>ตอน</span>
            </div>
          </div>
        </header>

        <div className="board-step-body">
          <section className="board-content" aria-labelledby="board-list-title">
            <div className="board-section-heading">
              <div>
                <h3 id="board-list-title">รายการตอน</h3>
                <p>จำนวนตอนซิงก์จากค่าที่เลือกในหน้า Idea Base โดยอัตโนมัติ</p>
              </div>
              <span>{filteredChapters.length} จาก {project.chapters.length} ตอน</span>
            </div>

            <div className="board-toolbar">
              <label className="board-search">
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาหมายเลข ชื่อตอน หรือเนื้อเรื่องย่อ" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ChapterStatus)} aria-label="กรองตามสถานะ">
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            {filteredChapters.length === 0 ? (
              <div className="board-empty-state">
                <Search size={22} />
                <div><h3>ไม่พบตอนที่ตรงกับตัวกรอง</h3><p>ลองเปลี่ยนคำค้นหาหรือเลือกสถานะอื่น</p></div>
              </div>
            ) : (
              <div className="board-chapter-grid">
                {filteredChapters.map((chapter) => (
                  <button key={chapter.id} className="board-chapter-card" onClick={() => openChapter(chapter.id)}>
                    <div className="chapter-card-top">
                      <span>ตอน {chapter.number}</span>
                      <span className={`status-badge ${chapter.status}`}>{statusLabel[chapter.status]}</span>
                    </div>
                    <h3>{chapter.title}</h3>
                    <p>{chapter.summary || 'ยังไม่มีเรื่องย่อสำหรับตอนนี้'}</p>
                    <div className="board-chapter-footer">
                      <span>{chapter.cliffhanger || 'ยังไม่ได้กำหนดจุดทิ้งท้าย'}</span>
                      <Edit3 size={16} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ChapterBoard;
