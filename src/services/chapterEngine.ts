// src/services/chapterEngine.ts

import type { ChapterMemory, ChapterPlan, NovelProject, SceneBeat, StoryState } from '../types';
import { extractOpening, openingStrategyFor } from './chapterDiversity';
import { richTextToPlainText } from './richText';

const LOCATIONS = [
  'หอจดหมายเหตุใต้เมือง',
  'รถไฟเที่ยวสุดท้าย',
  'ตลาดแลกเปลี่ยนความทรงจำ',
  'โรงพยาบาลร้างริมแม่น้ำ',
  'ห้องประชุมของสภาเมือง',
  'คฤหาสน์บนหน้าผา',
  'สวนกระจกหลังมหาวิหาร',
  'อุโมงค์ใต้หอนาฬิกา',
  'สถานีส่งสัญญาณกลางป่า',
  'ลานพิธีที่ถูกปิดตาย',
  'ห้องเก็บหลักฐานของศัตรู',
  'จุดกำเนิดของคำสาป',
];

const TIME_MARKERS = [
  'ก่อนรุ่งสาง', 'เช้าวันถัดมา', 'บ่ายที่ฝนกำลังตั้งเค้า', 'หลังเที่ยงคืน',
  'ก่อนเส้นตายหนึ่งชั่วโมง', 'คืนเดือนดับ', 'หลังเหตุการณ์เมื่อคืน', 'ช่วงที่เมืองประกาศปิดตาย',
];

function compact(value: string, max = 220) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
}

function previousMemory(project: NovelProject, chapter: ChapterPlan): ChapterMemory | undefined {
  return project.chapters
    .filter((item) => item.number < chapter.number && item.memory)
    .sort((a, b) => b.number - a.number)[0]?.memory;
}

export function buildScenePlan(project: NovelProject, chapter: ChapterPlan): SceneBeat[] {
  const strategy = openingStrategyFor(chapter);
  const prior = previousMemory(project, chapter);
  const characters = project.bible.characters.map((item) => item.name).filter(Boolean);
  const lead = characters[0] || 'ตัวเอก';
  const partner = characters[1] || 'คู่ร่วมทาง';
  const opponent = characters[2] || 'ผู้ขัดขวาง';
  const location = LOCATIONS[(chapter.number - 1) % LOCATIONS.length];
  const nextLocation = LOCATIONS[chapter.number % LOCATIONS.length];

  return [
    {
      order: 1,
      purpose: `${strategy.label}: รับผลจากตอนก่อนและจุดชนวนปัญหาใหม่ทันที`,
      setting: prior?.location || location,
      viewpoint: chapter.number % 5 === 0 ? opponent : lead,
      conflict: prior?.nextHook || chapter.conflict,
      turn: `ข้อมูลหรือการมาถึงใหม่บังคับให้เป้าหมาย “${chapter.goal}” ต้องเปลี่ยนวิธี`,
    },
    {
      order: 2,
      purpose: 'ทดสอบความสัมพันธ์ผ่านการตัดสินใจ ไม่ใช่การอธิบาย',
      setting: location,
      viewpoint: lead,
      conflict: `${lead}กับ${partner}ต้องการผลลัพธ์เดียวกัน แต่ยอมจ่ายคนละราคา`,
      turn: `หนึ่งคนปิดบังข้อมูลที่กระทบ ${chapter.outcome}`,
    },
    {
      order: 3,
      purpose: 'ให้แผนล้มเหลวบางส่วนและเปิดความจริงที่เปลี่ยนความหมายของตอนก่อน',
      setting: location,
      viewpoint: chapter.number % 4 === 0 ? partner : lead,
      conflict: chapter.conflict,
      turn: chapter.outcome,
    },
    {
      order: 4,
      purpose: 'บังคับการเลือกที่มีผลถาวรและสร้างสะพานไปตอนถัดไป',
      setting: nextLocation,
      viewpoint: lead,
      conflict: `ตัวเลือกสุดท้ายทำให้บางสิ่งได้มาและบางสิ่งสูญเสีย`,
      turn: chapter.cliffhanger,
    },
  ];
}

export function scenePlanPrompt(scenePlan: SceneBeat[]): string {
  return scenePlan.map((scene) => [
    `ฉาก ${scene.order}`,
    `- หน้าที่: ${scene.purpose}`,
    `- สถานที่: ${scene.setting}`,
    `- มุมมอง: ${scene.viewpoint}`,
    `- ความขัดแย้ง: ${scene.conflict}`,
    `- จุดพลิก: ${scene.turn}`,
  ].join('\n')).join('\n\n');
}

export function createChapterMemory(project: NovelProject, chapter: ChapterPlan, text: string): ChapterMemory {
  const plain = richTextToPlainText(text).trim();
  const paragraphs = plain.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const scenePlan = chapter.scenePlan || buildScenePlan(project, chapter);
  const previous = previousMemory(project, chapter);
  const names = project.bible.characters.map((item) => item.name).filter(Boolean);
  const active = names.filter((name) => plain.includes(name)).slice(0, 5);

  return {
    summary: compact(`${chapter.summary} ผลที่เกิดขึ้นจริง: ${chapter.outcome}`, 420),
    location: scenePlan[scenePlan.length - 1]?.setting || previous?.location || 'ยังไม่ระบุ',
    timeMarker: TIME_MARKERS[(chapter.number - 1) % TIME_MARKERS.length],
    characterStates: (active.length ? active : names.slice(0, 2)).map((name, index) =>
      `${name}: ${index === 0 ? `ต้องรับผลจาก ${chapter.outcome}` : `ความไว้ใจเปลี่ยนเพราะเหตุการณ์ตอน ${chapter.number}`}`,
    ),
    relationshipChanges: [`ความสัมพันธ์หลักเปลี่ยนจากผลของ “${chapter.conflict}”`],
    newFacts: [`ตอน ${chapter.number} ยืนยันว่า ${chapter.outcome}`],
    resolvedThreads: chapter.number % 3 === 0 ? [chapter.goal] : [],
    openThreads: [chapter.cliffhanger, ...project.bible.mysteries.slice(0, 2)].filter(Boolean).slice(0, 4),
    nextHook: chapter.cliffhanger,
    openingFingerprint: extractOpening(plain, 360),
  };
}

export function buildStoryState(project: NovelProject, chapter: ChapterPlan, memory: ChapterMemory): StoryState {
  const previous = project.storyState;
  return {
    currentLocation: memory.location,
    currentTime: memory.timeMarker,
    currentGoal: chapter.cliffhanger,
    currentConflict: chapter.conflict,
    activeCharacters: memory.characterStates.map((item) => item.split(':')[0]).filter(Boolean),
    relationshipState: [...(previous?.relationshipState || []), ...memory.relationshipChanges].slice(-8),
    inventoryAndEvidence: [...(previous?.inventoryAndEvidence || []), ...memory.newFacts].slice(-12),
    openThreads: Array.from(new Set([...(previous?.openThreads || []), ...memory.openThreads]))
      .filter((item) => !memory.resolvedThreads.includes(item)).slice(-12),
    resolvedThreads: Array.from(new Set([...(previous?.resolvedThreads || []), ...memory.resolvedThreads])).slice(-12),
    recentConsequences: [...(previous?.recentConsequences || []), `${chapter.title}: ${chapter.outcome}`].slice(-6),
  };
}

export function storyStatePrompt(project: NovelProject): string {
  const state = project.storyState;
  if (!state) return 'ยังไม่มี Story State ให้เริ่มจาก Story Bible และโครงตอน';
  return [
    `สถานที่ล่าสุด: ${state.currentLocation}`,
    `เวลาล่าสุด: ${state.currentTime}`,
    `เป้าหมายปัจจุบัน: ${state.currentGoal}`,
    `ความขัดแย้งปัจจุบัน: ${state.currentConflict}`,
    `ตัวละครที่กำลังมีบทบาท: ${state.activeCharacters.join(', ') || 'ไม่ระบุ'}`,
    `สถานะความสัมพันธ์: ${state.relationshipState.join(' | ') || 'ยังไม่มีการเปลี่ยนแปลง'}`,
    `หลักฐาน/ข้อเท็จจริง: ${state.inventoryAndEvidence.join(' | ') || 'ยังไม่มี'}`,
    `ปมค้าง: ${state.openThreads.join(' | ') || 'ไม่มี'}`,
    `ผลกระทบล่าสุด: ${state.recentConsequences.join(' | ') || 'ยังไม่มี'}`,
  ].join('\n');
}
