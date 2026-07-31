// src/components/ReaderAssistant.tsx

import { BookMarked, RefreshCw, Sparkles, WandSparkles } from 'lucide-react';
import type { ChapterPlan, NovelProject } from '../types';

interface Props {
  project: NovelProject;
  chapter: ChapterPlan;
  busy: boolean;
  onRewrite: () => void;
  onRegenerate: () => void;
}

function chapterReadingTime(chapter: ChapterPlan) {
  const words = (chapter.mainText || chapter.draft).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export default function ReaderAssistant({ project, chapter, busy, onRewrite, onRegenerate }: Props) {
  const characterNames = project.bible.characters.slice(0, 4).map((item) => item.name).join(' · ');
  const canon = chapter.canonUpdates.length ? chapter.canonUpdates : [chapter.outcome, chapter.cliffhanger];

  return (
    <aside className="reader-assistant">
      <div className="assistant-heading">
        <span className="assistant-orb"><Sparkles size={17} /></span>
        <div><small>AI Co-Author</small><strong>ผู้ช่วยประจำตอน</strong></div>
      </div>

      <div className="assistant-card">
        <span className="assistant-label">ภาพรวมตอน</span>
        <p>{chapter.summary}</p>
        <div className="assistant-meta"><span>{chapterReadingTime(chapter)} นาที</span><span>ตอนที่ {chapter.number}</span></div>
      </div>

      <div className="assistant-card">
        <span className="assistant-label"><BookMarked size={14} /> Canon ที่ต้องจำ</span>
        <ul>{canon.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
      </div>

      <div className="assistant-card">
        <span className="assistant-label">ตัวละครในจักรวาล</span>
        <p>{characterNames || 'AI จะบันทึกตัวละครสำคัญหลังสร้าง Story Bible'}</p>
      </div>

      <div className="assistant-actions">
        <button disabled={busy} onClick={onRewrite}><WandSparkles size={16} />ปรับสำนวนและจังหวะ</button>
        <button disabled={busy} onClick={onRegenerate}><RefreshCw size={16} />เขียนตอนนี้ใหม่</button>
      </div>
    </aside>
  );
}
