// src/services/typhoonStructured.ts

import { z } from 'zod';

function clean(value: string | undefined): string {
  return (value ?? '').replace(/^\s+|\s+$/g, '').replace(/\r/g, '');
}

function field(block: string, name: string): string {
  const match = block.match(new RegExp(`^${name}\\s*:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+\\s*:|$)`, 'mi'));
  return clean(match?.[1]);
}

function numberedLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

function blocks(raw: string, marker: string): string[] {
  const normalized = raw.replace(/```[a-z]*|```/gi, '').replace(/\r/g, '').trim();
  const parts = normalized.split(new RegExp(`(?:^|\\n)---${marker}---\\s*`, 'i')).slice(1);
  return parts.map((part) => part.split(new RegExp(`(?:^|\\n)---END_${marker}---`, 'i'))[0].trim()).filter(Boolean);
}

export function typhoonFormatInstruction(schemaName: string): string {
  if (schemaName === 'pitch_options') {
    return `ตอบตามรูปแบบข้อความนี้เท่านั้น ห้ามใช้ JSON และห้ามใช้ Markdown code fence\n\n---PITCH---\nTITLE: ชื่อโครงเรื่อง\nHOOK: จุดดึงดูดหลัก\nSTYLE: รูปแบบการเล่า\nRISK: สิ่งที่ต้องระวัง\n---END_PITCH---\n\nทำซ้ำให้ครบ 3 ชุด ห้ามเพิ่มข้อความอื่น`;
  }

  if (schemaName === 'story_bible') {
    return `ตอบตามรูปแบบข้อความนี้เท่านั้น ห้ามใช้ JSON และห้ามใช้ Markdown code fence\n\nPREMISE:\nเนื้อหา\nWORLD_RULES:\nเนื้อหา\nSTYLE_GUIDE:\nเนื้อหา\n---CHARACTER---\nNAME: ชื่อ\nROLE: บทบาท\nGOAL: เป้าหมาย\nCONFLICT: ความขัดแย้ง\nARC: พัฒนาการ\n---END_CHARACTER---\nTIMELINE:\n- เหตุการณ์ 1\n- เหตุการณ์ 2\nMYSTERIES:\n- ปม 1\n- ปม 2\n\nสร้างตัวละครอย่างน้อย 2 คน และห้ามเพิ่มหัวข้ออื่น`;
  }

  if (schemaName.startsWith('chapter_outlines_')) {
    return `ตอบตามรูปแบบข้อความนี้เท่านั้น ห้ามใช้ JSON และห้ามใช้ Markdown code fence\n\n---CHAPTER---\nNUMBER: 1\nTITLE: ชื่อตอน\nSUMMARY: เรื่องย่อตอน\nGOAL: เป้าหมายของตอน\nCONFLICT: ความขัดแย้ง\nOUTCOME: ผลลัพธ์ที่เปลี่ยนสถานะเรื่อง\nCLIFFHANGER: แรงดึงท้ายตอน\n---END_CHAPTER---\n\nทำซ้ำให้ครบทุกตอนตามช่วงเลขที่กำหนด ห้ามเพิ่มข้อความอื่น`;
  }

  if (schemaName === 'chapter_quality_review') {
    return `ตอบตามรูปแบบข้อความนี้เท่านั้น ห้ามใช้ JSON และห้ามใช้ Markdown code fence\n\n---REVIEW---\nAREA: continuity|logic|character|style|pacing|hook\nSEVERITY: low|medium|high\nTITLE: ชื่อประเด็น\nDETAIL: รายละเอียดปัญหา\nSUGGESTION: วิธีแก้ที่ลงมือทำได้\n---END_REVIEW---\n\nทำซ้ำเฉพาะประเด็นที่มีประโยชน์ อย่างน้อย 1 รายการ ห้ามเพิ่มข้อความอื่น`;
  }

  return 'ตอบเป็นข้อความที่มีหัวข้อและค่าตามคำสั่งเท่านั้น ห้ามใช้ JSON และห้ามใช้ Markdown code fence';
}

function parsePitchOptions(raw: string) {
  const options = blocks(raw, 'PITCH').map((block) => ({
    title: field(block, 'TITLE'),
    hook: field(block, 'HOOK'),
    style: field(block, 'STYLE'),
    risk: field(block, 'RISK'),
  }));
  return { options };
}

function parseStoryBible(raw: string) {
  const characterBlocks = blocks(raw, 'CHARACTER');
  const withoutCharacters = raw.replace(/---CHARACTER---[\s\S]*?---END_CHARACTER---/gi, '');
  return {
    bible: {
      premise: field(withoutCharacters, 'PREMISE'),
      worldRules: field(withoutCharacters, 'WORLD_RULES'),
      styleGuide: field(withoutCharacters, 'STYLE_GUIDE'),
      characters: characterBlocks.map((block) => ({
        name: field(block, 'NAME'),
        role: field(block, 'ROLE'),
        goal: field(block, 'GOAL'),
        conflict: field(block, 'CONFLICT'),
        arc: field(block, 'ARC'),
      })),
      timeline: numberedLines(field(withoutCharacters, 'TIMELINE')),
      mysteries: numberedLines(field(withoutCharacters, 'MYSTERIES')),
    },
  };
}

function parseChapterOutlines(raw: string) {
  return {
    chapters: blocks(raw, 'CHAPTER').map((block) => ({
      number: Number.parseInt(field(block, 'NUMBER'), 10),
      title: field(block, 'TITLE'),
      summary: field(block, 'SUMMARY'),
      goal: field(block, 'GOAL'),
      conflict: field(block, 'CONFLICT'),
      outcome: field(block, 'OUTCOME'),
      cliffhanger: field(block, 'CLIFFHANGER'),
    })),
  };
}

function parseReviews(raw: string) {
  return {
    items: blocks(raw, 'REVIEW').map((block) => ({
      area: field(block, 'AREA').toLowerCase(),
      severity: field(block, 'SEVERITY').toLowerCase(),
      title: field(block, 'TITLE'),
      detail: field(block, 'DETAIL'),
      suggestion: field(block, 'SUGGESTION'),
    })),
  };
}

function parseBySchemaName(raw: string, schemaName: string): unknown {
  if (schemaName === 'pitch_options') return parsePitchOptions(raw);
  if (schemaName === 'story_bible') return parseStoryBible(raw);
  if (schemaName.startsWith('chapter_outlines_')) return parseChapterOutlines(raw);
  if (schemaName === 'chapter_quality_review') return parseReviews(raw);
  throw new Error(`ยังไม่รองรับ Typhoon structured format: ${schemaName}`);
}

export function parseTyphoonStructured<T>(raw: string, schemaName: string, schema: z.ZodType<T>): T {
  const candidate = parseBySchemaName(raw, schemaName);
  const parsed = schema.safeParse(candidate);
  if (!parsed.success) {
    console.error('[Typhoon structured parse failed]', {
      schemaName,
      issues: parsed.error.issues,
      raw,
      candidate,
    });
    throw new Error('Typhoon ส่งข้อมูลไม่ครบตามรูปแบบที่ระบบต้องการ กรุณากดสร้างใหม่อีกครั้ง');
  }
  return parsed.data;
}
