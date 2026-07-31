// src/services/aiService.ts

import { z } from 'zod';
import { AiSettings, ChapterPlan, GenerationJob, NovelProject, PitchOption, ReviewItem, StoryBible } from '../types';
import { createChapter, createId } from '../data/defaultProject';
import { generateStructured, generateText } from './aiProvider';
import { appEnv } from './env';
import { countWords, parseWordTarget, richTextToPlainText } from './richText';
import { buildTyphoonNovelFoundation } from './typhoonPipeline';
import { buildChapterWritingContext } from './chapterContext';
import { generateMockChapter } from './mockNovelWriter';
import { openingRules } from './chapterDiversity';
import { buildScenePlan, scenePlanPrompt } from './chapterEngine';
import { evaluateChapterQuality, qualityRewriteInstruction } from './chapterQuality';

const now = () => new Date().toISOString();

const pitchResultSchema = z.object({
  options: z.array(z.object({
    title: z.string(),
    hook: z.string(),
    style: z.string(),
    risk: z.string(),
  })).length(3),
});

const bibleSchema = z.object({
  premise: z.string(),
  worldRules: z.string(),
  styleGuide: z.string(),
  characters: z.array(z.object({
    name: z.string(),
    role: z.string(),
    goal: z.string(),
    conflict: z.string(),
    arc: z.string(),
  })).min(1),
  timeline: z.array(z.string()).min(1),
  mysteries: z.array(z.string()),
});

const chapterOutlineSchema = z.object({
  number: z.number(),
  title: z.string(),
  summary: z.string(),
  goal: z.string(),
  conflict: z.string(),
  outcome: z.string(),
  cliffhanger: z.string(),
});

const reviewResultSchema = z.object({
  items: z.array(z.object({
    area: z.enum(['continuity', 'logic', 'character', 'style', 'pacing', 'hook']),
    severity: z.enum(['low', 'medium', 'high']),
    title: z.string(),
    detail: z.string(),
    suggestion: z.string(),
  })).min(1),
});

function useLiveAi(settings?: AiSettings) {
  return settings?.operationMode === 'api';
}

const thaiNovelSystemPrompt = 'คุณเป็นนักเขียนและบรรณาธิการนิยายภาษาไทยมืออาชีพ รักษาความต่อเนื่องของข้อมูล ห้ามกล่าวถึงคำสั่งหรือกระบวนการของ AI และตอบเป็นภาษาไทยเท่านั้น';

async function generateChapterAtTargetLength(settings: AiSettings, prompt: string, wordTarget: string) {
  const target = parseWordTarget(wordTarget);
  const initialTokenLimit = Math.min(12_000, Math.max(2_048, Math.ceil(target.target * 3.2)));
  let text = await generateText(settings, thaiNovelSystemPrompt, prompt, {
    maxOutputTokens: initialTokenLimit,
    temperature: 0.85,
  });

  if (countWords(text) > target.maximum) {
    text = await generateText(
      settings,
      thaiNovelSystemPrompt,
      `ปรับต้นฉบับนิยายนี้ให้เหลือ ${target.minimum}-${target.maximum} คำ โดยรักษาเหตุการณ์หลัก อารมณ์ ความต่อเนื่อง และ cliffhanger ไว้ ตัดเฉพาะคำซ้ำและรายละเอียดที่ไม่จำเป็น

ต้นฉบับ:
${text}

ส่งเฉพาะต้นฉบับที่ปรับแล้ว`,
      { maxOutputTokens: initialTokenLimit, temperature: 0.7 },
    );
  }

  for (let pass = 0; pass < 4 && countWords(text) < target.minimum; pass += 1) {
    const currentWords = countWords(text);
    const missingWords = target.minimum - currentWords;
    const continuation = await generateText(
      settings,
      thaiNovelSystemPrompt,
      `เขียนต้นฉบับนิยายต่อจากประโยคสุดท้ายของต้นฉบับด้านล่าง โดยไม่ทวนเนื้อหาเดิม ไม่ใส่หัวข้อ และไม่อธิบายกระบวนการ

ปัจจุบันมี ${currentWords} คำ ยังขาดอย่างน้อย ${missingWords} คำ เขียนเพิ่มประมาณ ${Math.ceil(missingWords * 1.1)} คำ และพาเรื่องไปถึงจุดจบตอนตาม brief

ต้นฉบับปัจจุบัน:
${text}

ส่งเฉพาะเนื้อหาที่เขียนต่อเพิ่มเท่านั้น`,
      {
        maxOutputTokens: Math.min(8_000, Math.max(1_024, Math.ceil(missingWords * 3.4))),
        temperature: 0.8,
      },
    );
    text = `${text.trim()}\n\n${continuation.trim()}`;
  }

  return text;
}

function addJob(type: GenerationJob['type'], prompt: string, resultPreview: string, settings: AiSettings | undefined, startedAt: number): GenerationJob {
  const isLive = useLiveAi(settings) && settings;
  return {
    id: createId('job'),
    type,
    status: 'done',
    prompt,
    resultPreview,
    createdAt: now(),
    provider: isLive ? settings.provider : settings?.operationMode === 'manual' ? 'manual' : 'mock',
    model: isLive
      ? settings.provider === 'typhoon'
        ? appEnv.typhoonModel
        : settings.model
      : settings?.operationMode === 'manual'
        ? 'Manual Prompt'
        : 'Mock AI',
    durationMs: Math.max(0, Date.now() - startedAt),
  };
}

export function buildPitchPrompt(project: NovelProject) {
  const idea = project.idea as NovelProject['idea'] & Record<string, unknown>;
  const genres = idea.genres.join(', ') || 'ยังไม่ระบุ';
  const seed = idea.seedIdea || 'ยังไม่ระบุ';
  const aiModeLabel = idea.aiMode === 'high_auto'
    ? 'อัตโนมัติสูง — โครงต้องชัดเจนและนำไปเขียนต่อได้ทันที'
    : idea.aiMode === 'manual_first'
      ? 'คนเขียนคุมเอง — เปิดช่องให้แก้โครงและตัดสินใจเอง'
      : 'มีผู้ช่วย — เสนอทางเลือกและให้คนเขียนยืนยันทุกขั้น';

  return [
    'คุณคือนักพัฒนาโครงเรื่องนิยายมืออาชีพ',
    'สร้างโครงเรื่องที่แตกต่างกัน 3 แนวทาง เพื่อให้ผู้เขียนเลือกเพียง 1 แนวทางไปพัฒนาต่อ',
    '',
    `ชื่อเรื่องชั่วคราว: ${project.title || 'ยังไม่ระบุ'}`,
    `แนวเรื่อง: ${genres}`,
    `ไอเดียตั้งต้น: ${seed}`,
    `กลุ่มผู้อ่าน: ${idea.targetReaders || 'ยังไม่ระบุ'}`,
    `จำนวนตอน: ${idea.chapterCount || 'ยังไม่ระบุ'}`,
    `จำนวนคำต่อตอน: ${idea.wordsPerChapter || 'ยังไม่ระบุ'}`,
    `โทนเรื่อง: ${idea.tone || 'ยังไม่ระบุ'}`,
    `โหมดการทำงานกับ AI: ${aiModeLabel} [${idea.aiMode}]`,
    `ข้อกำหนดเพิ่มเติม: ${idea.authorNotes || 'ไม่มี'}`,
    '',
    'แต่ละโครงเรื่องต้องมี: ชื่อโครงเรื่อง, hook, รูปแบบการเล่า และความเสี่ยงที่ผู้เขียนควรระวัง',
    'ทั้ง 3 โครงต้องมีแกนความขัดแย้งและทิศทางตอนจบต่างกันอย่างชัดเจน',
    `ออกแบบสเกลเรื่องให้รองรับ ${idea.chapterCount || 'จำนวนที่กำหนด'} ตอน ตอนละ ${idea.wordsPerChapter || 'ตามความเหมาะสม'} โดยไม่ยืดเรื่องหรือมีตอนน้ำ`,
    'ตอบเป็นภาษาไทย กระชับ และพร้อมนำไปพัฒนาต่อ',
  ].join('\n');
}

export function buildPitchIdeaSignature(project: NovelProject) {
  return JSON.stringify({ title: project.title, idea: project.idea });
}

export async function generatePitchOptions(project: NovelProject, customPrompt?: string, settings?: AiSettings) {
  const startedAt = Date.now();
  const genres = project.idea.genres.join(' + ') || 'ดราม่า';
  const seed = project.idea.seedIdea || 'ตัวเอกต้องเผชิญความจริงที่เปลี่ยนชีวิต';
  const prompt = customPrompt?.trim() || buildPitchPrompt(project);

  if (useLiveAi(settings) && settings) {
    const result = await generateStructured(
      settings,
      thaiNovelSystemPrompt,
      `${prompt}\n\nสร้างตัวเลือก exactly 3 รายการ แต่ละรายการต้องแตกต่างกันจริงและพร้อมใช้วางโครงนิยาย`,
      pitchResultSchema,
      'pitch_options',
    );
    const options: PitchOption[] = result.options.map((item) => ({ ...item, id: createId('pitch') }));
    return { options, job: addJob('pitch', prompt, `สร้างโครงเรื่องจริง ${options.length} แนวทาง`, settings, startedAt) };
  }

  const options: PitchOption[] = [
    {
      id: createId('pitch'),
      title: 'เส้นทางที่ 1: เงื่อนไขที่ไม่มีใครยอมรับ',
      hook: `${seed} แต่ทุกความสำเร็จต้องแลกด้วยการสูญเสียสิ่งที่ตัวเอกให้ความสำคัญที่สุด`,
      style: `${genres} / เน้นความขัดแย้ง / เดินเรื่องเข้มข้น`,
      risk: 'ต้องทำให้ราคาที่ตัวเอกจ่ายหนักขึ้นอย่างมีเหตุผล ไม่ซ้ำรูปแบบเดิม',
    },
    {
      id: createId('pitch'),
      title: 'เส้นทางที่ 2: ความจริงอีกด้านของเรื่อง',
      hook: `${seed} ก่อนพบว่าความจริงที่เชื่อมาตลอดถูกสร้างขึ้นเพื่อปกปิดตัวการที่อยู่ใกล้กว่าที่คิด`,
      style: `${genres} / ลึกลับ / ค่อยเปิดเผยข้อมูล`,
      risk: 'ต้องวางเบาะแสล่วงหน้าให้เพียงพอ เพื่อให้จุดหักมุมยุติธรรมกับผู้อ่าน',
    },
    {
      id: createId('pitch'),
      title: 'เส้นทางที่ 3: คนสำคัญกับเป้าหมายที่สวนทาง',
      hook: `${seed} และบังคับให้ตัวเอกเลือกระหว่างเป้าหมายที่ต้องทำให้สำเร็จกับคนที่ไม่อาจยอมเสียไป`,
      style: `${genres} / เน้นตัวละคร / ความสัมพันธ์เป็นแกน`,
      risk: 'แรงจูงใจของตัวละครทั้งสองฝ่ายต้องหนักแน่นพอให้การตัดสินใจน่าเชื่อถือ',
    },
  ];

  return { options, job: addJob('pitch', prompt, `สร้างโครงเรื่อง ${options.length} แนวทาง`, settings, startedAt) };
}

export async function buildStoryBibleFromPitch(project: NovelProject, pitch: PitchOption, settings?: AiSettings) {
  const startedAt = Date.now();
  const prompt = `Build story bible from pitch: ${pitch.title}`;
  const targetChapterCount = Math.max(1, project.idea.chapterCount || project.chapters.length);

  if (useLiveAi(settings) && settings) {
    if (settings.provider === 'typhoon') {
      const result = await buildTyphoonNovelFoundation(project, pitch, settings);
      return {
        ...result,
        job: addJob(
          'bible',
          prompt,
          `สร้าง Story Bible แบบหลายขั้นและโครงตอน ${result.chapters.length} ตอน`,
          settings,
          startedAt,
        ),
      };
    }

    const bibleResult = await generateStructured(
      settings,
      thaiNovelSystemPrompt,
      `สร้าง Story Bible จากข้อมูลต่อไปนี้

ชื่อเรื่อง: ${project.title}
แนวเรื่อง: ${project.idea.genres.join(', ')}
ไอเดียตั้งต้น: ${project.idea.seedIdea}
กลุ่มผู้อ่าน: ${project.idea.targetReaders}
โทน: ${project.idea.tone}
จำนวนตอน: ${targetChapterCount}
จำนวนคำต่อตอน: ${project.idea.wordsPerChapter}
ข้อกำหนดผู้เขียน: ${project.idea.authorNotes}
พล็อตที่เลือก: ${pitch.title}
Hook: ${pitch.hook}
แนวทางการเล่า: ${pitch.style}
ข้อควรระวัง: ${pitch.risk}

วาง premise, กฎโลก, style guide, ตัวละครหลัก, timeline และปมลึกลับให้เพียงพอสำหรับนิยาย ${targetChapterCount} ตอน ตอนละ ${project.idea.wordsPerChapter}`,
      z.object({ bible: bibleSchema }),
      'story_bible',
    );

    const chapterBatchSize = 20;
    const generatedOutlines: Array<z.infer<typeof chapterOutlineSchema>> = [];
    for (let start = 1; start <= targetChapterCount; start += chapterBatchSize) {
      const end = Math.min(targetChapterCount, start + chapterBatchSize - 1);
      const batchCount = end - start + 1;
      const batchResult = await generateStructured(
        settings,
        thaiNovelSystemPrompt,
        `สร้างโครงตอนที่ ${start} ถึง ${end} ของนิยายทั้งหมด ${targetChapterCount} ตอน

ชื่อเรื่อง: ${project.title}
พล็อต: ${pitch.title} — ${pitch.hook}
กลุ่มผู้อ่าน: ${project.idea.targetReaders}
โทน: ${project.idea.tone}
เป้าหมายความยาวต่อตอน: ${project.idea.wordsPerChapter}
ข้อกำหนดผู้เขียน: ${project.idea.authorNotes}
Story Bible: ${JSON.stringify(bibleResult.bible)}

ต้องคืนครบ ${batchCount} ตอน เลขตอนเรียง ${start} ถึง ${end} ทุกตอนมี title, summary, goal, conflict, outcome และ cliffhanger ที่ต่อเนื่องกันแต่ไม่ซ้ำกัน`,
        z.object({ chapters: z.array(chapterOutlineSchema).length(batchCount) }),
        `chapter_outlines_${start}_${end}`,
      );
      generatedOutlines.push(...batchResult.chapters);
    }

    const existingByNumber = new Map(project.chapters.map((chapter) => [chapter.number, chapter]));
    const chapters = generatedOutlines
      .sort((a, b) => a.number - b.number)
      .map((outline, index) => ({
        ...(existingByNumber.get(index + 1) ?? createChapter(index + 1)),
        ...outline,
        number: index + 1,
        updatedAt: now(),
      }));
    const bible: StoryBible = {
      ...bibleResult.bible,
      characters: bibleResult.bible.characters.map((character) => ({ ...character, id: createId('char') })),
      canonMemory: ['Story bible ถูกสร้างด้วย Live API แต่ยังไม่มีตอนหลักที่ผ่านการบันทึก'],
    };
    return { bible, chapters, job: addJob('bible', prompt, `สร้าง Story Bible และ ${chapters.length} ตอน`, settings, startedAt) };
  }

  const bible: StoryBible = {
    premise: `${pitch.title}: ${pitch.hook}`,
    worldRules:
      'พลังลึกลับทำงานภายใต้กฎแลกเปลี่ยนเสมอ ทุกการเปลี่ยนอดีตจะทิ้งร่องรอยในปัจจุบัน และความทรงจำของตัวละครสำคัญจะเป็นหลักฐานที่โกหกไม่ได้ทั้งหมด',
    styleGuide:
      'เขียนไทยร่วมสมัย อ่านลื่น มีภาพชัด เน้นความรู้สึกผ่านการกระทำ บทสนทนามี subtext และจบตอนด้วยแรงดึงที่เกี่ยวกับปมหลัก',
    characters: [
      {
        id: 'char_protagonist',
        name: 'ริน',
        role: 'ตัวเอก',
        goal: 'ตามหาความจริงของความทรงจำที่หายไป',
        conflict: 'ยิ่งเข้าใกล้ความจริง ยิ่งเสี่ยงเสียความสัมพันธ์ที่อยากปกป้อง',
        arc: 'จากคนที่เชื่อว่าต้องแก้ทุกอย่างคนเดียว ไปสู่คนที่ยอมไว้ใจผู้อื่น',
      },
      {
        id: 'char_love_interest',
        name: 'คีริน',
        role: 'คนสำคัญในวัยเด็ก',
        goal: 'หยุดคำสาปโดยไม่ให้รินจำอดีตทั้งหมด',
        conflict: 'ความลับที่ปิดไว้คือสิ่งเดียวที่ทำให้รินยังปลอดภัย',
        arc: 'จากผู้ปกป้องที่โกหกเพื่อรัก ไปสู่คนที่กล้าพูดความจริง',
      },
    ],
    timeline: [
      'วัยเด็ก: รินและคีรินทำสัญญากับพลังลึกลับโดยไม่เข้าใจผลแลกเปลี่ยน',
      'ตอนต้น: รินพบร่องรอยว่าความทรงจำของตนถูกแก้ไข',
      'กลางเรื่อง: ความจริงบางส่วนทำให้ความสัมพันธ์ของทั้งคู่แตกร้าว',
      'ท้ายเรื่อง: ทั้งคู่ต้องเลือกระหว่างคืนอดีตหรือรักษาปัจจุบัน',
    ],
    mysteries: [
      'ใครเป็นคนเริ่มแก้ความทรงจำครั้งแรก',
      'เหตุใดคีรินจำบางเรื่องได้มากกว่าคนอื่น',
      'ราคาจริงของการคืนอดีตคืออะไร',
    ],
    canonMemory: ['Story bible ถูกสร้างจาก pitch ที่เลือก แต่ยังไม่มีตอนหลักที่ผ่านการบันทึก'],
  };

  const existingChapters = new Map(project.chapters.map((chapter) => [chapter.number, chapter]));
  const chapters = Array.from({ length: targetChapterCount }, (_, index) => existingChapters.get(index + 1) ?? createChapter(index + 1)).map((chapter) => ({
    ...chapter,
    title:
      chapter.number === 1
        ? 'คืนที่ชื่อของเขากลับมา'
        : chapter.number === project.idea.chapterCount
          ? 'ราคาของความทรงจำ'
          : `ร่องรอยที่ ${chapter.number}`,
    summary:
      chapter.number === 1
        ? 'รินพบชื่อคีรินในสมุดที่ไม่ควรมีอยู่ และความทรงจำวัยเด็กเริ่มแตกเป็นเสี่ยง'
        : `รินและคีรินตามร่องรอยใหม่ ขณะความสัมพันธ์ถูกทดสอบด้วยความลับที่ยังพูดไม่ได้`,
    goal: chapter.number === 1 ? 'เปิดปมความทรงจำและแรงดึงของคู่หลัก' : chapter.goal,
    conflict: chapter.number % 3 === 0 ? 'ความจริงบางส่วนทำให้ตัวละครไม่ไว้ใจกัน' : chapter.conflict,
    outcome: chapter.number % 4 === 0 ? 'ได้หลักฐานใหม่ที่ขัดกับสิ่งที่เชื่อมาตลอด' : chapter.outcome,
    cliffhanger:
      chapter.number === 1
        ? 'คีรินเรียกรินด้วยชื่อเล่นที่ไม่มีใครควรรู้'
        : 'หลักฐานล่าสุดชี้ว่าคนใกล้ตัวอาจเกี่ยวข้องกับคำสาป',
    updatedAt: now(),
  }));

  return { bible, chapters, job: addJob('bible', prompt, bible.premise, settings, startedAt) };
}

export async function draftChapter(project: NovelProject, chapter: ChapterPlan, settings?: AiSettings) {
  const startedAt = Date.now();
  const prompt = `Draft chapter ${chapter.number}: ${chapter.title}`;
  const context = buildChapterWritingContext(project, chapter);
  const scenePlan = buildScenePlan(project, chapter);
  chapter.scenePlan = scenePlan;

  if (useLiveAi(settings) && settings) {
    const basePrompt = `เขียนต้นฉบับนิยายตอนที่ ${chapter.number}: ${chapter.title} ให้ต่อจากตอนก่อนหน้าโดยตรง

ตำแหน่งในเรื่อง: ${context.phase}
คำสั่งด้านโครงสร้าง: ${context.phaseInstruction}
เรื่องย่อ: ${chapter.summary}
เป้าหมายเชิงเหตุการณ์: ${chapter.goal}
ความขัดแย้ง: ${chapter.conflict}
ผลลัพธ์บังคับ: ${chapter.outcome}
Cliffhanger บังคับ: ${chapter.cliffhanger}
จำนวนคำเป้าหมาย: ${project.idea.wordsPerChapter}

Story Bible
Premise: ${project.bible.premise}
Style Guide: ${project.bible.styleGuide}
กฎโลก: ${project.bible.worldRules}
ตัวละครและสถานะ:
${context.characterState}

Story State ล่าสุด
${context.storyState}

Chapter Memory ล่าสุด
${context.previousMemories}

สรุปสองตอนก่อนหน้า:
${context.previousTwoChapterSummaries}

ข้อความท้ายตอนก่อนหน้า:
${context.previousChapterEnding}

Canon ล่าสุด:
- ${context.recentCanon}

ปมที่ยังไม่คลี่คลาย:
- ${context.unresolvedMysteries}

แผนฉากบังคับสำหรับตอนนี้
${scenePlanPrompt(scenePlan)}

${openingRules(project, chapter)}

ข้อกำหนดทั้งตอน:
- ฉากแรกต้องเกิดจากผลของตอนก่อนหรือเส้นเรื่องหลัก ห้ามรีเซ็ตสถานการณ์
- ใช้แผนฉากทั้ง 4 ฉาก แต่เขียนเป็นนิยายลื่นไหลโดยไม่ใส่หัวข้อฉาก
- ทุกฉากต้องเปลี่ยนข้อมูล ความสัมพันธ์ เป้าหมาย หรือความเสี่ยงอย่างน้อยหนึ่งอย่าง
- ห้ามใช้ย่อหน้าแม่แบบ ห้ามทวน brief และห้ามบอกตรง ๆ ว่า “เป้าหมาย/ผลลัพธ์ของตอนคือ”
- บทสนทนาต้องมี subtext และการกระทำประกอบ
- ประโยคท้ายต้องพาไปยัง “${chapter.cliffhanger}” โดยไม่คัดลอก brief ตรง ๆ
- ส่งเฉพาะต้นฉบับนิยาย ไม่มี Markdown และไม่มีคำอธิบายกระบวนการ`;

    let text = '';
    let lastReport;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const requestPrompt = attempt === 0
        ? basePrompt
        : `${qualityRewriteInstruction(lastReport!)}

ร่างเดิมที่ห้ามเลียนแบบ:
${text.slice(0, 5000)}

${basePrompt}`;
      text = await generateChapterAtTargetLength(settings, requestPrompt, project.idea.wordsPerChapter);
      lastReport = evaluateChapterQuality(project, chapter, text);
      if (!lastReport.needsRewrite) break;
    }

    const finalReport = evaluateChapterQuality(project, chapter, text);
    if (finalReport.needsRewrite) {
      throw new Error(`ตอนที่ ${chapter.number} ยังซ้ำกับตอนก่อนหลังเขียนใหม่ 3 รอบ (${finalReport.reasons.join(', ')})`);
    }

    return {
      text,
      scenePlan,
      qualityScore: finalReport.score,
      job: addJob('chapter', prompt, `เขียนตอนที่ ${chapter.number} · ${countWords(text)} คำ · คุณภาพ ${finalReport.score}/100`, settings, startedAt),
    };
  }

  const text = generateMockChapter(project, { ...chapter, scenePlan });
  const report = evaluateChapterQuality(project, chapter, text);
  return {
    text,
    scenePlan,
    qualityScore: report.score,
    job: addJob('chapter', prompt, `Mock ตอนที่ ${chapter.number} · คุณภาพ ${report.score}/100`, settings, startedAt),
  };
}

export async function rewriteChapter(project: NovelProject, chapter: ChapterPlan, settings?: AiSettings) {
  const startedAt = Date.now();
  const prompt = `Rewrite chapter ${chapter.number} for style and pacing`;
  const source = richTextToPlainText(chapter.draft || chapter.mainText);
  if (useLiveAi(settings) && settings) {
    const text = await generateChapterAtTargetLength(
      settings,
      `รีไรต์ต้นฉบับต่อไปนี้ให้สำนวนลื่น จังหวะดี ลดคำซ้ำ แต่รักษาเหตุการณ์ ข้อมูล canon และน้ำเสียงตาม Style Guide

Style Guide: ${project.bible.styleGuide}

ต้นฉบับ:
${source}

ส่งเฉพาะต้นฉบับฉบับปรับปรุง`,
      project.idea.wordsPerChapter,
    );
    return { text, job: addJob('rewrite', prompt, `รีไรต์ตอนที่ ${chapter.number}`, settings, startedAt) };
  }

  const text = `${source}

---
ฉบับปรับสำนวน: เพิ่มน้ำหนักอารมณ์ในฉากตัดสินใจ ลดการอธิบายซ้ำ และทำให้ประโยคท้ายตอนมีแรงดึงมากขึ้น`;

  return { text, job: addJob('rewrite', prompt, text.slice(-160), settings, startedAt) };
}

export async function reviseChapterFromReviews(project: NovelProject, chapter: ChapterPlan, reviews: ReviewItem[], settings?: AiSettings) {
  const startedAt = Date.now();
  const source = richTextToPlainText(chapter.draft || chapter.mainText);
  const prompt = `Revise chapter ${chapter.number} using selected review items: ${reviews.map((item) => item.area).join(', ')}`;
  if (useLiveAi(settings) && settings) {
    const text = await generateChapterAtTargetLength(
      settings,
      `แก้ไขต้นฉบับตามรายการตรวจที่เลือก โดยรักษาเหตุการณ์หลักและข้อมูล canon เดิม

Style Guide: ${project.bible.styleGuide}
รายการที่ต้องแก้:
${reviews.map((item, index) => `${index + 1}. [${item.area}/${item.severity}] ${item.title}\nรายละเอียด: ${item.detail}\nแนวทาง: ${item.suggestion}`).join('\n\n')}

ต้นฉบับ:
${source}

ส่งเฉพาะต้นฉบับฉบับแก้ไขสมบูรณ์`,
      project.idea.wordsPerChapter,
    );
    return { text, job: addJob('rewrite', prompt, `แก้ไข ${reviews.length} ประเด็น ตอนที่ ${chapter.number}`, settings, startedAt) };
  }

  const revisions = reviews.map((item) => {
    if (item.area === 'continuity') return `ผลของเหตุการณ์ครั้งนี้เปลี่ยนสิ่งที่ตัวละครรู้และส่งผลต่อความสัมพันธ์อย่างชัดเจน: ${chapter.outcome}`;
    if (item.area === 'pacing') return 'การตัดสินใจเกิดขึ้นทันทีหลังแรงกดดันเพิ่มขึ้น ทำให้ฉากเดินหน้าโดยไม่อธิบายเหตุการณ์เดิมซ้ำ';
    if (item.area === 'hook') return `ก่อนจบตอน หลักฐานใหม่ทำให้คำถามเดิมเปลี่ยนไป และชี้ตรงไปยังสิ่งที่รออยู่ในตอนถัดไป: ${chapter.cliffhanger}`;
    if (item.area === 'logic') return 'เหตุและผลของการตัดสินใจถูกเชื่อมเข้ากับกฎของโลกและข้อจำกัดที่ตัวละครไม่สามารถหลีกเลี่ยงได้';
    if (item.area === 'character') return 'การกระทำของตัวละครสะท้อนทั้งเป้าหมายส่วนตัวและความกลัวที่ทำให้การเลือกครั้งนี้มีราคาต้องจ่าย';
    return 'สำนวนถูกปรับให้กระชับขึ้น ลดคำอธิบายซ้ำ และคงน้ำเสียงเดียวกับส่วนก่อนหน้า';
  });
  const text = `${source.trim()}\n\n${revisions.join('\n\n')}`;

  return { text, job: addJob('rewrite', prompt, `แก้ไข ${reviews.length} ประเด็นจาก Quality Review`, settings, startedAt) };
}

export async function reviewChapter(project: NovelProject, chapter: ChapterPlan, settings?: AiSettings) {
  const startedAt = Date.now();
  const prompt = `Review chapter ${chapter.number} across continuity, logic, character, style, pacing, hook`;
  const hasDraft = Boolean(chapter.draft || chapter.mainText);
  if (useLiveAi(settings) && settings) {
    const source = richTextToPlainText(chapter.draft || chapter.mainText);
    const result = await generateStructured(
      settings,
      'คุณเป็นบรรณาธิการนิยายภาษาไทย ตรวจอย่างตรงไปตรงมาและเสนอวิธีแก้ที่ลงมือทำได้ ตอบเป็นภาษาไทยเท่านั้น',
      `ตรวจต้นฉบับตอนที่ ${chapter.number} ในด้าน continuity, logic, character, style, pacing และ hook

Premise: ${project.bible.premise}
กฎโลก: ${project.bible.worldRules}
Style Guide: ${project.bible.styleGuide}
Canon: ${project.bible.canonMemory.join('\n- ')}
Brief ตอน: ${chapter.summary}; เป้าหมาย ${chapter.goal}; ผลลัพธ์ ${chapter.outcome}; cliffhanger ${chapter.cliffhanger}

ต้นฉบับ:
${source}

คืนเฉพาะประเด็นที่มีประโยชน์จริง แต่ต้องมีอย่างน้อย 1 รายการ`,
      reviewResultSchema,
      'chapter_quality_review',
    );
    const items: ReviewItem[] = result.items.map((item) => ({ ...item, id: createId('review'), resolved: false }));
    return { items, job: addJob('review', prompt, `ตรวจพบ ${items.length} ประเด็น ตอนที่ ${chapter.number}`, settings, startedAt) };
  }

  const items: ReviewItem[] = [
    {
      id: createId('review'),
      area: 'continuity',
      severity: hasDraft ? 'medium' : 'high',
      title: 'ตรวจความต่อเนื่องกับ canon',
      detail: hasDraft
        ? 'ตอนนี้อ้างอิงปมความทรงจำและความสัมพันธ์หลักได้ แต่ควรระบุผลกระทบที่เปลี่ยนสถานะตัวละครให้ชัดขึ้น'
        : 'ยังไม่มีร่างตอนให้ตรวจ',
      suggestion: 'หลังแก้ร่าง ให้เพิ่ม canon update สั้น ๆ ว่าตัวละครรู้อะไรใหม่และความสัมพันธ์เปลี่ยนอย่างไร',
      resolved: false,
    },
    {
      id: createId('review'),
      area: 'pacing',
      severity: 'low',
      title: 'จังหวะตอน',
      detail: 'โครงตอนมี goal/conflict/outcome/cliffhanger ครบ เหมาะสำหรับร่างแรก',
      suggestion: 'ตอนรีไรต์ให้ตัดประโยคอธิบายซ้ำและเพิ่ม action beat ระหว่างบทสนทนา',
      resolved: false,
    },
    {
      id: createId('review'),
      area: 'hook',
      severity: 'medium',
      title: 'แรงดึงท้ายตอน',
      detail: 'Cliffhanger มีทิศทางดี แต่ควรโยงกับปมหลักหรือความสัมพันธ์สำคัญเสมอ',
      suggestion: 'ทำให้ประโยคท้ายตอนเปิดคำถามใหม่ที่กระทบทั้ง plot และ emotional stake',
      resolved: false,
    },
  ];

  return { items, job: addJob('review', prompt, `${items.length} review items`, settings, startedAt) };
}

export function summarizeCanonUpdate(chapter: ChapterPlan) {
  return [
    `ตอน ${chapter.number}: ${chapter.title} ถูกบันทึกเป็นตอนหลัก`,
    `ผลลัพธ์หลัก: ${chapter.outcome}`,
    `ปมท้ายตอน: ${chapter.cliffhanger}`,
  ];
}
