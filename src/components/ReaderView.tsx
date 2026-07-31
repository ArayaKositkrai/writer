// src/components/ReaderView.tsx

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Save } from 'lucide-react';
import type { NovelProject } from '../types';
import { richTextToPlainText } from '../services/richText';

interface Props { project: NovelProject; onChange: (project: NovelProject) => void; }

export default function ReaderView({ project, onChange }: Props) {
  const available = useMemo(() => project.chapters.filter((chapter) => (chapter.mainText || chapter.draft).trim()), [project.chapters]);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const chapter = available[index];
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft(chapter ? richTextToPlainText(chapter.mainText || chapter.draft) : '');
    setEditing(false);
  }, [chapter?.id]);

  if (!chapter) {
    return <section className="empty-view"><div className="empty-icon">✦</div><h1>ยังไม่มีต้นฉบับให้อ่าน</h1><p>ไปที่ “ให้ AI เขียน” แล้วสร้างนิยายทั้งเล่มก่อนค่ะ</p></section>;
  }

  function saveText() {
    onChange({
      ...project,
      chapters: project.chapters.map((item) => item.id === chapter.id ? { ...item, mainText: draft, draft, updatedAt: new Date().toISOString() } : item),
    });
    setEditing(false);
  }

  return (
    <div className="reader-view">
      <aside className="toc-panel">
        <span className="kicker">สารบัญ</span>
        <h2>{project.title}</h2>
        <div className="toc-list">
          {available.map((item, itemIndex) => (
            <button key={item.id} className={itemIndex === index ? 'active' : ''} onClick={() => setIndex(itemIndex)}>
              <span>{String(item.number).padStart(2, '0')}</span><strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </aside>

      <article className="reading-page">
        <header>
          <div><span>ตอนที่ {chapter.number}</span><h1>{chapter.title}</h1><p>{chapter.summary}</p></div>
          <button className="edit-button" onClick={() => editing ? saveText() : setEditing(true)}>{editing ? <Save size={17} /> : <Edit3 size={17} />}{editing ? 'บันทึก' : 'แก้ไขตอนนี้'}</button>
        </header>
        {editing ? <textarea className="chapter-editor" value={draft} onChange={(event) => setDraft(event.target.value)} /> : <div className="chapter-prose">{draft.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>}
        <footer>
          <button disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={18} />ตอนก่อนหน้า</button>
          <span>{index + 1} / {available.length}</span>
          <button disabled={index === available.length - 1} onClick={() => setIndex(index + 1)}>ตอนถัดไป<ChevronRight size={18} /></button>
        </footer>
      </article>
    </div>
  );
}
