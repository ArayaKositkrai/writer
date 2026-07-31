// src/services/chapterDiversity.ts

import type { ChapterPlan, NovelProject } from '../types';
import { richTextToPlainText } from './richText';

export interface OpeningStrategy {
  id: string;
  label: string;
  instruction: string;
}

const OPENING_STRATEGIES: OpeningStrategy[] = [
  { id: 'in-medias-res', label: 'เปิดกลางเหตุการณ์', instruction: 'เปิดกลางเหตุการณ์ที่กำลังผิดแผนทันที ให้ผู้อ่านจับสถานการณ์จากการกระทำและบทสนทนา' },
  { id: 'dialogue', label: 'เปิดด้วยบทสนทนา', instruction: 'เปิดด้วยประโยคบทสนทนาที่เปลี่ยนสถานะความสัมพันธ์หรือเผยข้อมูลใหม่ ห้ามเกริ่นสถานที่ก่อน' },
  { id: 'consequence', label: 'เปิดด้วยผลจากตอนก่อน', instruction: 'เปิดด้วยผลกระทบโดยตรงจากตอนก่อนหน้า ภายในสองย่อหน้าแรกต้องเห็นว่าการตัดสินใจเดิมสร้างปัญหาใหม่อย่างไร' },
  { id: 'discovery', label: 'เปิดด้วยการค้นพบ', instruction: 'เปิดด้วยการพบหลักฐาน วัตถุ หรือบุคคลที่ไม่ควรอยู่ตรงนั้น และให้การค้นพบนั้นเปลี่ยนเป้าหมายของตอน' },
  { id: 'deadline', label: 'เปิดด้วยเส้นตาย', instruction: 'เปิดด้วยเวลาที่กำลังหมดลงหรือข้อจำกัดเร่งด่วน ตัวละครต้องลงมือก่อนมีโอกาสอธิบายทุกอย่าง' },
  { id: 'other-pov', label: 'เปิดด้วยมุมมองตัวละครอื่น', instruction: 'เปิดด้วยมุมมองของตัวละครรองหรือคู่ปรับ แล้วค่อยเชื่อมกลับสู่ตัวเอกโดยไม่สรุปเหตุการณ์เดิม' },
  { id: 'public-event', label: 'เปิดในเหตุการณ์สาธารณะ', instruction: 'เปิดในงานประชุม พิธี การพิจารณา หรือสถานการณ์ที่มีคนเห็นจำนวนมาก ทำให้ตัวละครซ่อนความจริงได้ยาก' },
  { id: 'quiet-tension', label: 'เปิดด้วยความเงียบที่มีแรงกดดัน', instruction: 'เปิดด้วยกิจกรรมธรรมดาที่เต็มไปด้วยความตึงเครียด ใช้สิ่งที่ตัวละครไม่พูดเป็นแรงขับ ห้ามเปิดด้วยหน้าต่าง ฝน หรือตื่นนอน' },
  { id: 'message', label: 'เปิดด้วยข้อความหรือบันทึก', instruction: 'เปิดด้วยจดหมาย ข้อความ เสียงบันทึก หรือหลักฐานสั้น ๆ ที่บังคับให้ตัวละครตีความและตัดสินใจทันที' },
  { id: 'reversal', label: 'เปิดด้วยสิ่งที่ควรสำเร็จแต่ล้มเหลว', instruction: 'เปิดด้วยแผนที่ควรสำเร็จแต่กลับล้มเหลวในประโยคแรก ๆ แล้วแสดงผลเสียที่ไม่มีทางย้อนกลับ' },
  { id: 'arrival', label: 'เปิดด้วยการมาถึง', instruction: 'เปิดด้วยการมาถึงของคนหรือสิ่งที่ทุกคนรอหรือกลัว การมาถึงนั้นต้องสร้างคำถามใหม่ ไม่ใช่แค่เปลี่ยนสถานที่' },
  { id: 'aftermath', label: 'เปิดหลังเหตุการณ์ใหญ่', instruction: 'เปิดด้วยซากหรือผลพวงหลังเหตุการณ์สำคัญ ให้ตัวละครเก็บรายละเอียดและพบว่าความเสียหายไม่ตรงกับสิ่งที่คิด' },
];

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('th-TH')
    .replace(/[\p{P}\p{S}\s]+/gu, '')
    .trim();
}

function ngrams(value: string, size = 3): Set<string> {
  const normalized = normalize(value);
  const grams = new Set<string>();
  if (normalized.length <= size) {
    if (normalized) grams.add(normalized);
    return grams;
  }
  for (let index = 0; index <= normalized.length - size; index += 1) {
    grams.add(normalized.slice(index, index + size));
  }
  return grams;
}

export function textSimilarity(left: string, right: string): number {
  const a = ngrams(left);
  const b = ngrams(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  a.forEach((item) => {
    if (b.has(item)) intersection += 1;
  });
  return intersection / Math.max(1, a.size + b.size - intersection);
}

export function extractOpening(text: string, maxLength = 700): string {
  const plain = richTextToPlainText(text)
    .replace(/^#.+$/gm, '')
    .trim();
  const paragraphs = plain.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  return paragraphs.slice(0, 2).join('\n\n').slice(0, maxLength);
}

export function openingStrategyFor(chapter: ChapterPlan): OpeningStrategy {
  return OPENING_STRATEGIES[(Math.max(1, chapter.number) - 1) % OPENING_STRATEGIES.length];
}

export function previousOpenings(project: NovelProject, chapterNumber: number): string[] {
  return project.chapters
    .filter((item) => item.number < chapterNumber && (item.mainText || item.draft).trim())
    .sort((a, b) => b.number - a.number)
    .slice(0, 6)
    .map((item) => extractOpening(item.mainText || item.draft))
    .filter(Boolean);
}

export function findMostSimilarOpening(candidate: string, openings: string[]) {
  let best = { score: 0, opening: '' };
  openings.forEach((opening) => {
    const score = textSimilarity(candidate, opening);
    if (score > best.score) best = { score, opening };
  });
  return best;
}

export function repeatedFormulaScore(text: string): number {
  const opening = extractOpening(text, 1_200);
  const formulas = [
    'เป้าหมายของเธอในคืนนี้ชัดเจน',
    'เป้าหมายของเขาในคืนนี้ชัดเจน',
    'หยุดยืนอยู่หน้าหน้าต่าง',
    'เสียงฝนเคาะกระจก',
    'วางสมุดเก่าลงบนโต๊ะ',
    'ทุกอย่างที่เคยมั่นใจก็เริ่มหลุดออกจากกัน',
    'ผลลัพธ์ของคืนนี้คือ',
    'ก่อนที่เธอจะพูดอะไร ไฟทั้งห้องดับลงพร้อมกัน',
  ];
  return formulas.reduce((score, formula) => score + (opening.includes(formula) ? 1 : 0), 0);
}

export function openingNeedsRewrite(candidateText: string, project: NovelProject, chapter: ChapterPlan) {
  const candidateOpening = extractOpening(candidateText);
  const comparison = findMostSimilarOpening(candidateOpening, previousOpenings(project, chapter.number));
  const formulaScore = repeatedFormulaScore(candidateText);
  return {
    needsRewrite: comparison.score >= 0.34 || formulaScore > 0,
    similarity: comparison.score,
    formulaScore,
    candidateOpening,
    matchedOpening: comparison.opening,
  };
}

export function openingRules(project: NovelProject, chapter: ChapterPlan): string {
  const strategy = openingStrategyFor(chapter);
  const used = previousOpenings(project, chapter.number);
  return [
    `รูปแบบฉากเปิดบังคับสำหรับตอนนี้: ${strategy.label}`,
    strategy.instruction,
    'ข้อห้ามฉากเปิด:',
    '- ห้ามเปิดด้วยตัวละครยืนหน้าต่าง มองเงาตัวเอง ฟังฝน หรือตื่นนอน',
    '- ห้ามเขียนประโยคว่า “เป้าหมายของตอนนี้/คืนนี้คือ” หรืออธิบาย brief ตรง ๆ',
    '- ห้ามทวนเรื่องย่อ กฎโลก หรือเหตุการณ์เดิมเป็นย่อหน้าสรุป',
    '- ห้ามใช้โครงบทสนทนา สมุดเก่า ไฟดับ และเสียงเด็กซ้ำเป็นสูตรสำเร็จ',
    '- ฉากแรกต้องสร้างเหตุการณ์ใหม่และเปลี่ยนสถานะของเรื่องภายใน 3 ย่อหน้า',
    used.length
      ? `ตัวอย่างฉากเปิดที่ใช้ไปแล้วและห้ามเลียนแบบ:\n${used.map((item, index) => `${index + 1}. ${item.slice(0, 260)}`).join('\n')}`
      : 'ยังไม่มีฉากเปิดก่อนหน้า',
  ].join('\n');
}
