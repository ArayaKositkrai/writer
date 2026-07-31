// src/services/mockNovelWriter.ts

import type { ChapterPlan, NovelProject } from '../types';
import { buildChapterWritingContext } from './chapterContext';
import { buildScenePlan } from './chapterEngine';
import { openingStrategyFor } from './chapterDiversity';

function names(project: NovelProject) {
  const list = project.bible.characters.map((item) => item.name).filter(Boolean);
  return { lead: list[0] || 'ริน', partner: list[1] || 'คีริน', rival: list[2] || 'เมษา' };
}

function opening(project: NovelProject, chapter: ChapterPlan) {
  const { lead, partner, rival } = names(project);
  const strategy = openingStrategyFor(chapter).id;
  const variants: Record<string, string> = {
    'in-medias-res': `กระจกบานที่สามแตกก่อน${lead}จะวิ่งพ้นโถง และเสียงฝีเท้าด้านหลังก็ใกล้เข้ามาเร็วเกินกว่าจะหันกลับไปดู`,
    dialogue: `“ถ้าเธออ่านข้อความบรรทัดสุดท้าย เราจะไม่มีทางกลับไปเป็นเหมือนเดิม” ${partner}พูดก่อนที่${lead}จะทันแตะซองจดหมาย`,
    consequence: `ตราประทับที่พวกเขาขโมยมาเมื่อคืนกำลังเผาไหม้อยู่กลางโต๊ะ ทั้งที่ไม่มีใครจุดไฟ และชื่อของ${lead}กำลังหายไปทีละตัวอักษร`,
    discovery: `${lead}พบรองเท้าของ${rival}วางอยู่หน้าประตูห้องที่ถูกปิดตายมาสิบปี แต่ฝุ่นบนพื้นกลับมีรอยเท้าออกมาเพียงข้างเดียว`,
    deadline: `อีกสิบเจ็ดนาทีประตูเมืองจะปิด และ${lead}ยังต้องเลือกว่าจะช่วย${partner}หรือหยุดขบวนหลักฐานที่กำลังถูกเผา`,
    'other-pov': `${rival}รู้ก่อนทุกคนว่าคำสาปเริ่มทำงานอีกครั้ง เพราะความทรงจำเรื่องแม่ของเขาหายไปในระหว่างที่กำลังพูดชื่อเธอ`,
    'public-event': `พิธีประกาศผู้บริสุทธิ์หยุดลงเมื่อภาพของ${lead}ปรากฏบนจอหลัก พร้อมคำตัดสินที่ไม่มีใครในห้องเป็นคนลงนาม`,
    'quiet-tension': `${partner}จัดช้อนสามคันให้ขนานกันบนโต๊ะ ทั้งที่มีคนนั่งเพียงสองคน และ${lead}รู้จากมือที่สั่นว่าเขากำลังรอใครบางคน`,
    message: `ข้อความเสียงยาวเจ็ดวินาทีส่งมาจากหมายเลขของ${lead}เอง ทั้งที่ประโยคในนั้นเป็นคำเตือนจากวันพรุ่งนี้`,
    reversal: `แผนเปิดห้องนิรภัยสำเร็จทุกขั้น ยกเว้นสิ่งเดียว—ด้านในไม่มีหลักฐาน มีเพียงเก้าอี้ตัวหนึ่งที่ยังอุ่นอยู่`,
    arrival: `รถสีดำคันนั้นมาถึงก่อนเวลาสามชั่วโมง และคนที่ลงมาคือคนซึ่ง${lead}เห็นตายไปต่อหน้าตัวเอง`,
    aftermath: `เมื่อควันจางลง เหลือเพียงเงาคนหนึ่งติดอยู่บนกำแพง ทั้งที่เจ้าของเงายังยืนหอบอยู่ข้าง${lead}`,
  };
  return variants[strategy] || variants['in-medias-res'];
}

export function generateMockChapter(project: NovelProject, chapter: ChapterPlan) {
  const context = buildChapterWritingContext(project, chapter);
  const scenes = chapter.scenePlan || buildScenePlan(project, chapter);
  const { lead, partner, rival } = names(project);
  const paragraphs: string[] = [opening(project, chapter)];

  scenes.forEach((scene, index) => {
    if (index === 0) {
      paragraphs.push(`${scene.setting}ไม่เปิดโอกาสให้พวกเขาตั้งหลัก ${lead}ต้องรับช่วงจากปมเดิมทันที—${scene.conflict}—และการเลือกครั้งแรกทำให้วิธีไปถึง “${chapter.goal}” เปลี่ยนไปโดยไม่มีทางย้อนกลับ`);
    } else if (index === 1) {
      paragraphs.push(`ที่${scene.setting} ${partner}ยอมบอกความจริงเพียงครึ่งเดียว ส่วน${lead}เห็นช่องว่างในคำพูดนั้นแต่เลือกเก็บไว้ ความเงียบระหว่างทั้งคู่จึงไม่ใช่การพัก หากเป็นการต่อรองว่าใครจะยอมเสียความไว้ใจก่อน`);
      paragraphs.push(`“เธอไม่ได้อยากรู้ความจริงทั้งหมด” ${partner}กล่าว “เธออยากรู้เฉพาะความจริงที่ยังทำให้ฉันเป็นคนเดิมได้”`);
    } else if (index === 2) {
      paragraphs.push(`แผนพังตรงจุดที่ไม่มีใครคาด ${rival}ไม่ได้ขวางพวกเขา แต่ยื่นหลักฐานที่ทำให้เหตุการณ์ก่อนหน้ากลับความหมาย ${scene.turn} และทันใดนั้นคนที่ดูเหมือนศัตรูกลับเป็นคนเดียวที่มีเหตุผลจะช่วย`);
      paragraphs.push(`${lead}ต้องตัดสินใจต่อหน้าทุกคน เธอเลือกการกระทำที่ช่วยเป้าหมายระยะสั้น แต่ผลัก${partner}ออกไปไกลกว่าเดิม การตัดสินใจนั้นทิ้งบาดแผลที่ไม่สามารถซ่อมด้วยคำขอโทษง่าย ๆ`);
    } else {
      paragraphs.push(`เมื่อไปถึง${scene.setting} ผลลัพธ์ของตอนก็เกิดขึ้นจริง: ${chapter.outcome} สิ่งที่ได้มาไม่ใช่คำตอบสมบูรณ์ แต่เป็นข้อเท็จจริงที่ทำให้คำถามเดิมใช้ต่อไม่ได้`);
      paragraphs.push(`${context.phaseInstruction} ${lead}จึงเลือกพกความจริงเพียงส่วนหนึ่งไปต่อ และทิ้งอีกส่วนไว้กับคนที่เธอยังไม่แน่ใจว่าจะเชื่อได้หรือไม่`);
    }
  });

  paragraphs.push(`ก่อนแยกจากกัน ${partner}หันกลับมาพูดประโยคเดียวที่เปลี่ยนทิศของเรื่อง: “${chapter.cliffhanger}” จากนั้นสัญญาณทั้งหมดก็ดับลงพร้อมกัน เหลือเพียงหลักฐานชิ้นใหม่ที่ชี้ไปยังตอนถัดไป`);
  return paragraphs.join('\n\n');
}
