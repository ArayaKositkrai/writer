// src/components/GenerateView.tsx

import { Check, ChevronRight, LoaderCircle, Sparkles, WandSparkles } from 'lucide-react';
import type { NovelProject, PitchOption } from '../types';

interface Props {
  project: NovelProject;
  onChoosePitch: (pitch: PitchOption) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  busy: boolean;
  completedCount: number;
}

export default function GenerateView({ project, onChoosePitch, onGenerate, onRegenerate, busy, completedCount }: Props) {
  const selectedPitch = project.pitches.find((pitch) => pitch.id === project.selectedPitchId);

  return (
    <div className="generate-view">
      <header className="page-intro">
        <span className="kicker"><Sparkles size={15} /> AI วางโครงให้แล้ว</span>
        <h1>เลือกเส้นทางของเรื่อง</h1>
        <p>เลือกหนึ่งแนวทางที่ชอบ จากนั้น AI จะเขียนต่อเนื่องครบทุกตอนโดยใช้ Story Bible คุมความจำทั้งเล่ม</p>
      </header>

      <section className="pitch-gallery">
        {project.pitches.map((pitch, index) => {
          const selected = project.selectedPitchId === pitch.id;
          return (
            <button key={pitch.id} className={selected ? 'pitch-option selected' : 'pitch-option'} onClick={() => onChoosePitch(pitch)}>
              <div className="pitch-art" data-index={index + 1}><span>0{index + 1}</span>{selected && <i><Check size={17} /></i>}</div>
              <div className="pitch-content"><h2>{pitch.title}</h2><p>{pitch.hook}</p><div><span>{pitch.style}</span><small>{pitch.risk}</small></div></div>
            </button>
          );
        })}
      </section>

      <section className="outline-board">
        <div className="outline-header">
          <div><span className="kicker">โครงสร้างทั้งเล่ม</span><h2>{project.chapters.length} ตอน พร้อมเขียน</h2></div>
          <span className="outline-selected">{selectedPitch?.title || 'เลือกพล็อตด้านบน'}</span>
        </div>
        <div className="chapter-timeline">
          {project.chapters.map((chapter, index) => {
            const done = Boolean((chapter.mainText || chapter.draft).trim());
            return (
              <article key={chapter.id}>
                <div className={done ? 'chapter-index done' : 'chapter-index'}>{done ? <Check size={15} /> : chapter.number}</div>
                <div><small>ตอนที่ {chapter.number}</small><h3>{chapter.title}</h3><p>{chapter.summary}</p></div>
                {index < project.chapters.length - 1 && <ChevronRight className="chapter-arrow" size={18} />}
              </article>
            );
          })}
        </div>
      </section>

      <section className="generation-console">
        <div>
          <span className="kicker">พร้อมเริ่มเขียน</span>
          <h2>{completedCount ? `เขียนแล้ว ${completedCount} ตอน` : 'ให้ AI เขียนทั้งเล่มในครั้งเดียว'}</h2>
          <p>คุณสามารถปิดหน้าเว็บแล้วกลับมาเขียนตอนที่เหลือต่อได้ ระบบจะข้ามตอนที่เสร็จแล้วอัตโนมัติ</p>
        </div>
        <div className="generation-actions">
          {completedCount > 0 && (
            <button className="regenerate-book-button" onClick={onRegenerate} disabled={busy || !project.selectedPitchId}>
              <WandSparkles size={18} /> เขียนใหม่ทั้งเล่ม (แก้ตอนเปิดซ้ำ)
            </button>
          )}
          <button className="generate-book-button" onClick={onGenerate} disabled={busy || !project.selectedPitchId}>
            {busy ? <LoaderCircle className="spin" size={20} /> : <WandSparkles size={20} />}
            {busy ? 'กำลังเขียนนิยาย...' : completedCount ? 'เขียนตอนที่เหลือให้ครบ' : 'เริ่มเขียนทั้งเล่ม'}
          </button>
        </div>
      </section>
    </div>
  );
}
