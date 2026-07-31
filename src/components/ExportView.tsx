// src/components/ExportView.tsx

import { BookOpenCheck, Download, FileJson, FileText } from 'lucide-react';
import type { NovelProject } from '../types';

interface Props { project: NovelProject; onDocx: () => void | Promise<void>; onMarkdown: () => void; onJson: () => void; }

export default function ExportView({ project, onDocx, onMarkdown, onJson }: Props) {
  const ready = project.chapters.filter((chapter) => (chapter.mainText || chapter.draft).trim()).length;
  const totalWords = project.chapters.reduce((sum, chapter) => sum + (chapter.mainText || chapter.draft).trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="export-view">
      <section className="export-cover">
        <div className="book-mockup"><div className="book-spine" /><div className="book-front"><span>Novel Studio</span><h2>{project.title}</h2><small>AI-assisted manuscript</small></div></div>
        <div className="export-copy"><span className="kicker"><BookOpenCheck size={15} /> ต้นฉบับพร้อมแล้ว</span><h1>ดาวน์โหลดนิยายทั้งเล่ม</h1><p>รวมหน้าปก ชื่อเรื่อง สารบัญ และเนื้อหาทุกตอนในไฟล์เดียว จัดรูปแบบให้อ่านง่ายและแก้ไขต่อได้</p><div className="manuscript-stats"><div><strong>{ready}</strong><span>ตอน</span></div><div><strong>{totalWords.toLocaleString()}</strong><span>คำโดยประมาณ</span></div></div><button className="download-primary" disabled={!ready} onClick={() => void onDocx()}><Download size={20} />ดาวน์โหลดทั้งเล่ม .DOCX</button></div>
      </section>
      <section className="export-formats"><button disabled={!ready} onClick={onMarkdown}><FileText size={24} /><div><strong>Markdown</strong><span>เหมาะสำหรับเก็บต้นฉบับหรือย้ายไปแอปเขียนอื่น</span></div></button><button onClick={onJson}><FileJson size={24} /><div><strong>Project Backup</strong><span>สำรองพล็อต ตัวละคร โครงตอน และต้นฉบับทั้งหมด</span></div></button></section>
    </div>
  );
}
