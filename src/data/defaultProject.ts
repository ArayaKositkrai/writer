// src/data/defaultProject.ts

import { ChapterPlan, NovelProject } from '../types';

const now = () => new Date().toISOString();

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createChapter(number: number): ChapterPlan {
  return {
    id: `chapter_${number}`,
    number,
    title: `ตอนที่ ${number}: จุดเปลี่ยนที่ ${number}`,
    summary:
      number === 1
        ? 'เปิดตัวเอก ปัญหาหลัก และเหตุการณ์ที่บีบให้เข้าสู่เส้นทางของเรื่อง'
        : `ขยายปมจากตอนก่อนหน้า พร้อมผลักตัวละครเข้าสู่ความขัดแย้งระดับที่ ${number}`,
    goal: number === 1 ? 'ทำให้ผู้อ่านเข้าใจแรงขับของตัวเอก' : 'เดินหน้าเป้าหมายหลักของตัวเอก',
    conflict: 'มีอุปสรรคที่ทำให้ตัวเอกต้องตัดสินใจยากขึ้น',
    outcome: 'ตัวเอกได้ข้อมูลหรือผลลัพธ์ใหม่ที่เปลี่ยนสถานการณ์',
    cliffhanger: 'ทิ้งคำถามหรือเหตุการณ์ที่ทำให้อยากอ่านตอนถัดไป',
    status: number === 1 ? 'drafting' : 'planned',
    draft: '',
    mainText: '',
    canonUpdates: [],
    updatedAt: now(),
  };
}

export function buildChapters(count: number): ChapterPlan[] {
  return Array.from({ length: count }, (_, idx) => createChapter(idx + 1));
}

export function createDefaultProject(): NovelProject {
  return {
    id: createId('project'),
    ownerMode: 'guest',
    title: 'นิยายเรื่องใหม่',
    updatedAt: now(),
    idea: {
      genres: ['แฟนตาซี', 'โรแมนติก', 'ดราม่า'],
      seedIdea:
        'ตัวเอกกลับมาเจอคนสำคัญในวัยเด็กอีกครั้ง แต่โลกที่ทั้งคู่รู้จักกำลังถูกบิดเบือนด้วยพลังลึกลับ',
      targetReaders: 'นักอ่านเว็บโนเวลที่ชอบความสัมพันธ์เข้มข้นและพล็อตมีปมให้ตาม',
      chapterCount: 12,
      wordsPerChapter: '1,500 - 2,000 คำ',
      tone: 'เข้มข้น อบอุ่น มีปมลึกลับ และจบตอนแบบค้างคา',
      aiMode: 'guided',
      authorNotes:
        'ห้ามมีตอนน้ำ ทุกตอนต้องมีเป้าหมาย ความขัดแย้ง ผลลัพธ์ และบางสิ่งที่เปลี่ยนไป',
    },
    pitches: [],
    bible: {
      premise:
        'นิยายกำลังอยู่ในช่วงตั้งต้น ใช้ Idea Base และ Pitch Lab เพื่อเลือกทิศทางหลักก่อน',
      worldRules: 'กฎโลกและข้อจำกัดของพลังจะถูกเติมหลังเลือกพล็อต',
      styleGuide:
        'ภาษาไทยอ่านลื่น กระชับ มีน้ำหนักอารมณ์ ไม่อธิบายซ้ำ และเน้นแรงดึงท้ายตอน',
      characters: [
        {
          id: 'char_protagonist',
          name: 'ตัวเอก',
          role: 'Protagonist',
          goal: 'ค้นหาความจริงและปกป้องคนสำคัญ',
          conflict: 'อดีตที่จำไม่ครบทำให้ตัดสินใจผิดพลาดได้ง่าย',
          arc: 'จากคนที่หนีปัญหาไปสู่คนที่กล้าเผชิญความจริง',
        },
      ],
      timeline: ['จุดเริ่มต้น: ตัวเอกพบสัญญาณว่าความทรงจำของตัวเองไม่สมบูรณ์'],
      mysteries: ['ใครเป็นคนบิดเบือนอดีตของตัวเอก'],
      canonMemory: ['ยังไม่มีตอนที่บันทึกเป็นตอนหลัก'],
    },
    chapters: buildChapters(12),
    reviews: {},
    jobs: [],
    currentChapterId: 'chapter_1',
  };
}
