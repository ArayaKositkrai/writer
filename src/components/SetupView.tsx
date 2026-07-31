// src/components/SetupView.tsx

import { ArrowRight, BookOpen, Sparkles, WandSparkles } from 'lucide-react';
import type { NovelProject } from '../types';

interface Props {
  project: NovelProject;
  onChange: (project: NovelProject) => void;
  onCreateOutline: () => void;
  busy: boolean;
}

const genreOptions = ['แฟนตาซี', 'โรแมนติก', 'ดราม่า', 'สืบสวน', 'ไซไฟ', 'สยองขวัญ', 'ผจญภัย'];

export default function SetupView({ project, onChange, onCreateOutline, busy }: Props) {
  const updateIdea = (patch: Partial<NovelProject['idea']>) => onChange({
    ...project,
    idea: { ...project.idea, ...patch },
    updatedAt: new Date().toISOString(),
  });

  function toggleGenre(genre: string) {
    const genres = project.idea.genres.includes(genre)
      ? project.idea.genres.filter((item) => item !== genre)
      : [...project.idea.genres, genre];
    updateIdea({ genres });
  }

  return (
    <div className="setup-view">
      <section className="creation-hero">
        <div className="hero-copy">
          <span className="kicker"><Sparkles size={15} /> AI แต่งนิยายทั้งเล่มให้คุณ</span>
          <h1>เล่าไอเดียมาแค่ไม่กี่บรรทัด<br /><em>ที่เหลือให้ AI จัดการ</em></h1>
          <p>AI จะช่วยคิดพล็อต สร้างตัวละคร วางโครงตอน เขียนเนื้อหาทั้งเล่ม และจัดไฟล์ให้ดาวน์โหลดพร้อมอ่าน</p>
        </div>
        <div className="story-orb" aria-hidden="true">
          <div className="orb-ring ring-one" />
          <div className="orb-ring ring-two" />
          <BookOpen size={42} />
        </div>
      </section>

      <section className="idea-composer">
        <div className="composer-topline">
          <span>ไอเดียเรื่องของคุณ</span>
          <small>{project.idea.seedIdea.length}/1,200</small>
        </div>
        <textarea
          value={project.idea.seedIdea}
          maxLength={1200}
          onChange={(event) => updateIdea({ seedIdea: event.target.value })}
          placeholder="เช่น นักศึกษาคนหนึ่งพบว่านาฬิกาเก่าของคุณยายสามารถย้อนเวลาได้ แต่ทุกครั้งที่ย้อนกลับ เขาจะสูญเสียความทรงจำหนึ่งเรื่อง..."
          autoFocus
        />
        <div className="composer-footer">
          <div className="genre-chips">
            {genreOptions.map((genre) => (
              <button
                type="button"
                key={genre}
                className={project.idea.genres.includes(genre) ? 'genre-chip selected' : 'genre-chip'}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
          <button
            className="create-story-button"
            onClick={onCreateOutline}
            disabled={busy || !project.idea.seedIdea.trim()}
          >
            <WandSparkles size={19} />
            {busy ? 'AI กำลังสร้างโลก...' : 'สร้างนิยายด้วย AI'}
            {!busy && <ArrowRight size={18} />}
          </button>
        </div>
      </section>

      <section className="simple-options">
        <div className="option-heading">
          <div><span className="kicker">ปรับได้ตามใจ</span><h2>รายละเอียดเพิ่มเติม</h2></div>
          <p>ไม่จำเป็นต้องกรอกทุกช่อง AI สามารถช่วยตัดสินใจให้ได้ค่ะ</p>
        </div>
        <div className="option-grid">
          <label><span>ชื่อเรื่อง</span><input value={project.title} onChange={(event) => onChange({ ...project, title: event.target.value })} placeholder="ให้ AI ตั้งชื่อให้ก็ได้" /></label>
          <label><span>จำนวนตอน</span><select value={project.idea.chapterCount} onChange={(event) => updateIdea({ chapterCount: Number(event.target.value) })}>{[5, 8, 10, 12, 20, 30].map((value) => <option key={value} value={value}>{value} ตอน</option>)}</select></label>
          <label><span>ความยาวต่อตอน</span><select value={project.idea.wordsPerChapter} onChange={(event) => updateIdea({ wordsPerChapter: event.target.value })}><option>800 - 1,200 คำ</option><option>1,200 - 1,800 คำ</option><option>1,500 - 2,000 คำ</option></select></label>
          <label><span>กลุ่มผู้อ่าน</span><input value={project.idea.targetReaders} onChange={(event) => updateIdea({ targetReaders: event.target.value })} placeholder="เช่น วัยรุ่น / ผู้ใหญ่" /></label>
          <label><span>อารมณ์ของเรื่อง</span><input value={project.idea.tone} onChange={(event) => updateIdea({ tone: event.target.value })} placeholder="ลึกลับ อบอุ่น เข้มข้น" /></label>
          <label className="wide"><span>สิ่งที่อยากให้ AI จำเป็นพิเศษ</span><textarea value={project.idea.authorNotes} onChange={(event) => updateIdea({ authorNotes: event.target.value })} placeholder="เช่น เน้นความสัมพันธ์ของตัวละคร จบแบบประทับใจ ไม่มีตอนน้ำ" /></label>
        </div>
      </section>
    </div>
  );
}
