// src/services/chapterQuality.ts

import type { ChapterPlan, NovelProject } from '../types';
import { extractOpening, openingNeedsRewrite, textSimilarity } from './chapterDiversity';
import { richTextToPlainText } from './richText';

export interface ChapterQualityReport {
  score: number;
  needsRewrite: boolean;
  reasons: string[];
  openingSimilarity: number;
  wholeChapterSimilarity: number;
  repeatedParagraphs: number;
}

function paragraphs(text: string) {
  return richTextToPlainText(text).split(/\n{2,}/).map((item) => item.trim()).filter((item) => item.length > 80);
}

export function evaluateChapterQuality(project: NovelProject, chapter: ChapterPlan, text: string): ChapterQualityReport {
  const reasons: string[] = [];
  const opening = openingNeedsRewrite(text, project, chapter);
  const previousTexts = project.chapters
    .filter((item) => item.number < chapter.number && (item.mainText || item.draft).trim())
    .sort((a, b) => b.number - a.number)
    .slice(0, 3)
    .map((item) => richTextToPlainText(item.mainText || item.draft));
  const plain = richTextToPlainText(text);
  const wholeChapterSimilarity = previousTexts.reduce((best, previous) => Math.max(best, textSimilarity(plain.slice(0, 3500), previous.slice(0, 3500))), 0);
  const currentParagraphs = paragraphs(text);
  const previousParagraphs = previousTexts.flatMap(paragraphs);
  const repeatedParagraphs = currentParagraphs.filter((item) =>
    previousParagraphs.some((previous) => textSimilarity(item, previous) >= 0.72),
  ).length;

  let score = 100;
  if (opening.needsRewrite) {
    score -= 35;
    reasons.push('ฉากเปิดคล้ายตอนก่อนหรือใช้สูตรเปิดซ้ำ');
  }
  if (wholeChapterSimilarity >= 0.42) {
    score -= 30;
    reasons.push('โครงภาษาและเนื้อหาภาพรวมคล้ายตอนก่อนมากเกินไป');
  }
  if (repeatedParagraphs > 0) {
    score -= Math.min(30, repeatedParagraphs * 12);
    reasons.push(`พบย่อหน้าคล้ายตอนก่อน ${repeatedParagraphs} ย่อหน้า`);
  }
  if (!plain.includes(chapter.outcome.slice(0, Math.min(14, chapter.outcome.length)))) {
    score -= 8;
    reasons.push('ผลลัพธ์ของตอนยังไม่ปรากฏชัดในต้นฉบับ');
  }
  if (plain.length < 900) {
    score -= 10;
    reasons.push('ต้นฉบับสั้นเกินไปสำหรับการพัฒนาเหตุการณ์');
  }

  return {
    score: Math.max(0, score),
    needsRewrite: score < 75,
    reasons,
    openingSimilarity: opening.similarity,
    wholeChapterSimilarity,
    repeatedParagraphs,
  };
}

export function qualityRewriteInstruction(report: ChapterQualityReport): string {
  return [
    `ร่างถูกปฏิเสธด้วยคะแนน ${report.score}/100`,
    ...report.reasons.map((item) => `- ${item}`),
    '- เขียนใหม่ทั้งตอน ห้ามแก้แค่ประโยคแรก',
    '- เปลี่ยนผู้ริเริ่มเหตุการณ์ สถานที่ จังหวะ และชนิดความขัดแย้งของฉากเปิด',
    '- ห้ามใช้ย่อหน้าหรือบทสนทนาเดิมจากร่างที่ถูกปฏิเสธ',
  ].join('\n');
}
