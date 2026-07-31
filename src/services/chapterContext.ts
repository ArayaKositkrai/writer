// src/services/chapterContext.ts

import type { ChapterPlan, NovelProject } from '../types';
import { richTextToPlainText } from './richText';
import { storyStatePrompt } from './chapterEngine';

export interface ChapterWritingContext {
  phase: string;
  phaseInstruction: string;
  previousChapterSummary: string;
  previousChapterEnding: string;
  recentCanon: string;
  unresolvedMysteries: string;
  characterState: string;
  previousTwoChapterSummaries: string;
  previousMemories: string;
  storyState: string;
}

function trimText(value: string, maximum: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maximum) return normalized;
  return `${normalized.slice(0, maximum).trim()}…`;
}

export function getStoryPhase(chapterNumber: number, chapterCount: number) {
  const ratio = chapterCount <= 1 ? 1 : (chapterNumber - 1) / (chapterCount - 1);
  if (ratio <= 0.08) {
    return {
      phase: 'opening',
      phaseInstruction: 'เปิดโลก แนะนำแรงปรารถนาของตัวเอก และทิ้งคำถามหลัก ห้ามรีบเฉลยปมสำคัญ',
    };
  }
  if (ratio <= 0.3) {
    return {
      phase: 'rising-action',
      phaseInstruction: 'เพิ่มเบาะแสและอุปสรรค ทำให้ความสัมพันธ์เปลี่ยนจริง และยกระดับราคาที่ต้องจ่าย',
    };
  }
  if (ratio <= 0.55) {
    return {
      phase: 'midpoint',
      phaseInstruction: 'เปิดเผยความจริงครึ่งหนึ่งหรือกลับทิศเป้าหมาย ตัวละครต้องตัดสินใจที่ย้อนกลับไม่ได้',
    };
  }
  if (ratio <= 0.78) {
    return {
      phase: 'crisis',
      phaseInstruction: 'ทำให้แผนพัง ความเชื่อใจแตกร้าว และบีบตัวละครให้เผชิญผลจากการเลือกก่อนหน้า',
    };
  }
  if (ratio < 1) {
    return {
      phase: 'climax-build',
      phaseInstruction: 'รวมปมสำคัญเข้าสู่การเผชิญหน้าครั้งสุดท้าย ห้ามสร้างปมใหม่ที่ใหญ่กว่าปมหลัก',
    };
  }
  return {
    phase: 'resolution',
    phaseInstruction: 'คลี่คลายปมหลัก จ่ายผลลัพธ์ทางอารมณ์ และปิดเส้นทางตัวละครอย่างสมเหตุผล',
  };
}

export function buildChapterWritingContext(project: NovelProject, chapter: ChapterPlan): ChapterWritingContext {
  const priorChapters = project.chapters
    .filter((item) => item.number < chapter.number && (item.mainText || item.draft).trim())
    .sort((a, b) => b.number - a.number);
  const previous = priorChapters[0];
  const previousText = previous ? richTextToPlainText(previous.mainText || previous.draft) : '';
  const paragraphs = previousText.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const ending = paragraphs.slice(-2).join('\n\n');
  const phase = getStoryPhase(chapter.number, project.chapters.length || project.idea.chapterCount);

  return {
    ...phase,
    previousChapterSummary: previous
      ? `ตอน ${previous.number}: ${previous.title} — ${previous.summary}; ผลลัพธ์: ${previous.outcome}`
      : 'ยังไม่มีตอนก่อนหน้า ให้เปิดเรื่องจาก premise และ brief ตอนนี้',
    previousChapterEnding: trimText(ending, 1_500) || 'ไม่มีข้อความท้ายตอนก่อนหน้า',
    recentCanon: project.bible.canonMemory.slice(-10).join('\n- ') || 'ยังไม่มี canon จากตอนก่อนหน้า',
    unresolvedMysteries: project.bible.mysteries.slice(0, 8).join('\n- ') || 'ไม่มีรายการปมค้างที่ระบุไว้',
    characterState: project.bible.characters
      .map((item) => `${item.name} (${item.role}) — เป้าหมาย: ${item.goal}; ความขัดแย้ง: ${item.conflict}; arc: ${item.arc}`)
      .join('\n'),
    previousMemories: priorChapters.slice(0, 3).reverse()
      .map((item) => item.memory ? `ตอน ${item.number}: ${item.memory.summary}; สถานที่ ${item.memory.location}; ปมต่อ ${item.memory.nextHook}` : '')
      .filter(Boolean).join('\n') || 'ยังไม่มี Chapter Memory',
    storyState: storyStatePrompt(project),
    previousTwoChapterSummaries: priorChapters.slice(0, 2).reverse()
      .map((item) => `ตอน ${item.number}: ${item.title} — ${item.summary}; ผลลัพธ์ ${item.outcome}; ปมท้าย ${item.cliffhanger}`)
      .join('\n') || 'ยังไม่มีตอนก่อนหน้า',
  };
}
