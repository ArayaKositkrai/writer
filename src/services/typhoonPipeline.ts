// src/services/typhoonPipeline.ts

import type { ChapterPlan, NovelProject, PitchOption, StoryBible } from '../types';
import { createChapter, createId } from '../data/defaultProject';
import { generateText } from './aiProvider';

interface CoreBibleResult {
  premise: string;
  worldRules: string;
  styleGuide: string;
}

interface CharacterDraft {
  name: string;
  role: string;
  goal: string;
  conflict: string;
  arc: string;
}

interface OutlineDraft {
  number: number;
  title: string;
  summary: string;
  goal: string;
  conflict: string;
  outcome: string;
  cliffhanger: string;
}

const SYSTEM = [
  'คุณเป็นทีมเขียนนิยายภาษาไทยระดับมืออาชีพ',
  'ทำงานทีละขั้น รักษาความต่อเนื่องของโลก ตัวละคร และเหตุการณ์',
  'ตอบเป็นภาษาไทยเท่านั้น และห้ามอธิบายกระบวนการของ AI',
].join('\n');

function normalize(raw: string): string {
  return raw.replace(/```(?:text|markdown)?/gi, '').replace(/```/g, '').replace(/\r/g, '').trim();
}

function extractSection(raw: string, heading: string, nextHeadings: string[]): string {
  const normalized = normalize(raw);
  const endings = nextHeadings.length > 0
    ? `(?=\\n(?:${nextHeadings.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*:|$)`
    : '$';
  const expression = new RegExp(`${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([\\s\\S]*?)${endings}`, 'i');
  return expression.exec(normalized)?.[1]?.trim() ?? '';
}

function parseCore(raw: string, pitch: PitchOption): CoreBibleResult {
  const premise = extractSection(raw, 'PREMISE', ['WORLD_RULES', 'STYLE_GUIDE']);
  const worldRules = extractSection(raw, 'WORLD_RULES', ['STYLE_GUIDE']);
  const styleGuide = extractSection(raw, 'STYLE_GUIDE', []);

  return {
    premise: premise || `${pitch.title}: ${pitch.hook}`,
    worldRules: worldRules || 'ทุกเหตุการณ์สำคัญต้องมีเหตุและผล กฎของโลกใช้เหมือนเดิมตลอดทั้งเรื่อง และการฝ่าฝืนกฎต้องมีราคาที่ต้องจ่าย',
    styleGuide: styleGuide || 'เขียนภาษาไทยร่วมสมัย อ่านลื่น เน้นภาพ การกระทำ และบทสนทนาที่มีนัย ลดการอธิบายซ้ำ และจบตอนด้วยแรงดึงที่ส่งต่อไปตอนถัดไป',
  };
}

function blockValues(raw: string, marker: string): string[] {
  const normalized = normalize(raw);
  const regex = new RegExp(`---${marker}---([\\s\\S]*?)(?=---END_${marker}---|---${marker}---|$)`, 'gi');
  return Array.from(normalized.matchAll(regex)).map((match) => match[1].trim()).filter(Boolean);
}

function field(block: string, name: string, next: string[]): string {
  const endings = next.length > 0 ? `(?=\\n(?:${next.join('|')})\\s*:|$)` : '$';
  return new RegExp(`${name}\\s*:\\s*([\\s\\S]*?)${endings}`, 'i').exec(block)?.[1]?.trim() ?? '';
}

function parseCharacters(raw: string): CharacterDraft[] {
  return blockValues(raw, 'CHARACTER')
    .map((block) => ({
      name: field(block, 'NAME', ['ROLE', 'GOAL', 'CONFLICT', 'ARC']),
      role: field(block, 'ROLE', ['GOAL', 'CONFLICT', 'ARC']),
      goal: field(block, 'GOAL', ['CONFLICT', 'ARC']),
      conflict: field(block, 'CONFLICT', ['ARC']),
      arc: field(block, 'ARC', []),
    }))
    .filter((item) => item.name && item.role);
}

function listFromSection(raw: string, heading: string, nextHeadings: string[]): string[] {
  return extractSection(raw, heading, nextHeadings)
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

function parseOutlines(raw: string): OutlineDraft[] {
  return blockValues(raw, 'CHAPTER')
    .map((block) => ({
      number: Number.parseInt(field(block, 'NUMBER', ['TITLE', 'SUMMARY', 'GOAL', 'CONFLICT', 'OUTCOME', 'CLIFFHANGER']), 10),
      title: field(block, 'TITLE', ['SUMMARY', 'GOAL', 'CONFLICT', 'OUTCOME', 'CLIFFHANGER']),
      summary: field(block, 'SUMMARY', ['GOAL', 'CONFLICT', 'OUTCOME', 'CLIFFHANGER']),
      goal: field(block, 'GOAL', ['CONFLICT', 'OUTCOME', 'CLIFFHANGER']),
      conflict: field(block, 'CONFLICT', ['OUTCOME', 'CLIFFHANGER']),
      outcome: field(block, 'OUTCOME', ['CLIFFHANGER']),
      cliffhanger: field(block, 'CLIFFHANGER', []),
    }))
    .filter((item) => Number.isFinite(item.number) && item.title);
}

function fallbackCharacter(index: number): CharacterDraft {
  return index === 0
    ? {
        name: 'ตัวเอก',
        role: 'ผู้ขับเคลื่อนเรื่อง',
        goal: 'ทำเป้าหมายหลักของเรื่องให้สำเร็จ',
        conflict: 'ต้องเลือกระหว่างเป้าหมายกับสิ่งที่รัก',
        arc: 'เรียนรู้ที่จะเผชิญความจริงและยอมรับผลของการตัดสินใจ',
      }
    : {
        name: 'คู่ปรับสำคัญ',
        role: 'แรงต้านและกระจกสะท้อนตัวเอก',
        goal: 'รักษาสิ่งที่ตนเชื่อว่าถูกต้อง',
        conflict: 'เป้าหมายขัดกับตัวเอกแต่มีเหตุผลที่น่าเชื่อถือ',
        arc: 'เผยแรงจูงใจที่ทำให้ความขัดแย้งซับซ้อนขึ้น',
      };
}

function fallbackOutline(number: number, total: number, pitch: PitchOption, previous?: OutlineDraft): OutlineDraft {
  const phase = number === 1
    ? 'เปิดโลกและจุดชนวน'
    : number === total
      ? 'บทสรุปและราคาที่ต้องจ่าย'
      : number <= Math.ceil(total * 0.3)
        ? 'ขยายปมและแรงกดดัน'
        : number <= Math.ceil(total * 0.65)
          ? 'ยกระดับความขัดแย้งและเปิดเผยความจริง'
          : 'เร่งสู่จุดแตกหักและไคลแมกซ์';

  return {
    number,
    title: number === 1 ? 'จุดเริ่มต้นที่เปลี่ยนทุกอย่าง' : number === total ? 'คำตอบสุดท้าย' : `บทที่ ${number}: ${phase}`,
    summary: `${phase} โดยต่อจากผลของตอนก่อนหน้า${previous ? ` (${previous.outcome})` : ''} และผลักแกนเรื่อง “${pitch.hook}” ไปข้างหน้า`,
    goal: `ทำให้ตัวละครบรรลุเป้าหมายระยะสั้นของตอนที่ ${number}`,
    conflict: `แรงต้านใหม่บังคับให้ตัวละครตัดสินใจยากขึ้นกว่าตอนก่อน`,
    outcome: `สถานะของเรื่องและความสัมพันธ์เปลี่ยนไปอย่างชัดเจนหลังตอนที่ ${number}`,
    cliffhanger: number === total ? 'ปิดปมหลักและทิ้งภาพจำของเรื่อง' : 'การค้นพบใหม่ทำให้เป้าหมายของตอนถัดไปเปลี่ยนไป',
  };
}

async function ask(settings: Parameters<typeof generateText>[0], prompt: string, maxOutputTokens = 2_048) {
  return generateText(settings, SYSTEM, prompt, { maxOutputTokens, temperature: 0.45 });
}

export async function buildTyphoonNovelFoundation(
  project: NovelProject,
  pitch: PitchOption,
  settings: Parameters<typeof generateText>[0],
): Promise<{ bible: StoryBible; chapters: ChapterPlan[] }> {
  const total = Math.max(1, project.idea.chapterCount || project.chapters.length || 12);
  const shared = [
    `ชื่อเรื่อง: ${project.title}`,
    `แนวเรื่อง: ${project.idea.genres.join(', ')}`,
    `ไอเดีย: ${project.idea.seedIdea}`,
    `กลุ่มผู้อ่าน: ${project.idea.targetReaders}`,
    `โทน: ${project.idea.tone}`,
    `ข้อกำหนดผู้เขียน: ${project.idea.authorNotes || 'ไม่มี'}`,
    `พล็อตที่เลือก: ${pitch.title}`,
    `Hook: ${pitch.hook}`,
    `แนวทาง: ${pitch.style}`,
    `ความเสี่ยงที่ต้องเลี่ยง: ${pitch.risk}`,
  ].join('\n');

  const coreRaw = await ask(settings, `${shared}\n\nสร้างแกนเรื่องเพียง 3 ส่วนตามรูปแบบนี้ ห้ามเพิ่มหัวข้ออื่น:\nPREMISE:\n...\nWORLD_RULES:\n...\nSTYLE_GUIDE:\n...`, 1_600);
  const core = parseCore(coreRaw, pitch);

  const charactersRaw = await ask(settings, `${shared}\n\nPremise: ${core.premise}\nกฎโลก: ${core.worldRules}\n\nสร้างตัวละครหลัก 3-5 คน แต่ละคนต้องมีแรงจูงใจต่างกัน ตอบตามรูปแบบซ้ำนี้:\n---CHARACTER---\nNAME: ...\nROLE: ...\nGOAL: ...\nCONFLICT: ...\nARC: ...\n---END_CHARACTER---`, 2_400);
  const parsedCharacters = parseCharacters(charactersRaw);
  const characters = (parsedCharacters.length >= 2 ? parsedCharacters : [fallbackCharacter(0), fallbackCharacter(1)])
    .slice(0, 6)
    .map((item) => ({ ...item, id: createId('char') }));

  const continuityRaw = await ask(settings, `${shared}\n\nPremise: ${core.premise}\nตัวละคร: ${characters.map((item) => `${item.name} (${item.role})`).join(', ')}\n\nสร้างเส้นเวลาและปมที่ต้องติดตาม ตอบตามรูปแบบนี้:\nTIMELINE:\n- เหตุการณ์\n- เหตุการณ์\nMYSTERIES:\n- ปม\n- ปม`, 1_800);
  const timeline = listFromSection(continuityRaw, 'TIMELINE', ['MYSTERIES']);
  const mysteries = listFromSection(continuityRaw, 'MYSTERIES', []);

  const bible: StoryBible = {
    premise: core.premise,
    worldRules: core.worldRules,
    styleGuide: core.styleGuide,
    characters,
    timeline: timeline.length ? timeline : ['จุดชนวนเปิดเรื่อง', 'ความจริงกลางเรื่องเปลี่ยนทิศทาง', 'การตัดสินใจสุดท้ายปิดปมหลัก'],
    mysteries: mysteries.length ? mysteries : ['ความจริงที่ตัวเอกยังไม่รู้', 'ราคาที่แท้จริงของชัยชนะ'],
    canonMemory: ['Story Bible สร้างเสร็จแล้ว ยังไม่มีตอนหลักที่บันทึก'],
  };

  const existing = new Map(project.chapters.map((chapter) => [chapter.number, chapter]));
  const allOutlines: OutlineDraft[] = [];
  const batchSize = 3;

  for (let start = 1; start <= total; start += batchSize) {
    const end = Math.min(total, start + batchSize - 1);
    const previous = allOutlines.length > 0 ? allOutlines[allOutlines.length - 1] : undefined;
    const raw = await ask(settings, `${shared}\n\nStory Bible:\nPremise: ${bible.premise}\nกฎโลก: ${bible.worldRules}\nตัวละคร: ${bible.characters.map((item) => `${item.name}: ${item.goal}; ${item.conflict}`).join('\n')}\nTimeline: ${bible.timeline.join(' | ')}\nปม: ${bible.mysteries.join(' | ')}\nตอนก่อนหน้า: ${previous ? `${previous.number}. ${previous.title} — ${previous.outcome}; ท้ายตอน ${previous.cliffhanger}` : 'ยังไม่มี'}\n\nวางโครงตอน ${start}-${end} จากทั้งหมด ${total} ตอน ให้แต่ละตอนต่อกันและเปลี่ยนสถานะเรื่องจริง ตอบซ้ำตามรูปแบบนี้เท่านั้น:\n---CHAPTER---\nNUMBER: เลขตอน\nTITLE: ...\nSUMMARY: ...\nGOAL: ...\nCONFLICT: ...\nOUTCOME: ...\nCLIFFHANGER: ...\n---END_CHAPTER---`, 2_800);

    const parsed = parseOutlines(raw);
    for (let number = start; number <= end; number += 1) {
      const found = parsed.find((item) => item.number === number);
      const prior = allOutlines.length > 0 ? allOutlines[allOutlines.length - 1] : undefined;
      allOutlines.push(found ?? fallbackOutline(number, total, pitch, prior));
    }
  }

  const chapters = allOutlines.map((outline) => ({
    ...(existing.get(outline.number) ?? createChapter(outline.number)),
    ...outline,
    number: outline.number,
    updatedAt: new Date().toISOString(),
  }));

  return { bible, chapters };
}
