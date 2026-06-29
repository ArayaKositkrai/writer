import { ChapterPlan, GenerationJob, NovelProject, PitchOption, ReviewItem, StoryBible } from '../types';
import { createChapter, createId } from '../data/defaultProject';

const now = () => new Date().toISOString();

function addJob(type: GenerationJob['type'], prompt: string, resultPreview: string): GenerationJob {
  return {
    id: createId('job'),
    type,
    status: 'done',
    prompt,
    resultPreview,
    createdAt: now(),
  };
}

export function buildPitchPrompt(project: NovelProject) {
  const idea = project.idea as NovelProject['idea'] & Record<string, unknown>;
  const genres = idea.genres.join(', ') || 'ยังไม่ระบุ';
  const seed = idea.seedIdea || 'ยังไม่ระบุ';

  return [
    'คุณคือนักพัฒนาโครงเรื่องนิยายมืออาชีพ',
    'สร้างโครงเรื่องที่แตกต่างกัน 3 แนวทาง เพื่อให้ผู้เขียนเลือกเพียง 1 แนวทางไปพัฒนาต่อ',
    '',
    `ชื่อเรื่องชั่วคราว: ${project.title || 'ยังไม่ระบุ'}`,
    `แนวเรื่อง: ${genres}`,
    `ไอเดียตั้งต้น: ${seed}`,
    `กลุ่มผู้อ่าน: ${idea.targetReaders || 'ยังไม่ระบุ'}`,
    `จำนวนตอน: ${idea.chapterCount || 'ยังไม่ระบุ'}`,
    `โทนเรื่อง: ${idea.tone || 'ยังไม่ระบุ'}`,
    `พล็อตยอดนิยม: ${String(idea.template || 'ยังไม่ระบุ')}`,
    `ข้อกำหนดเพิ่มเติม: ${idea.authorNotes || 'ไม่มี'}`,
    '',
    'แต่ละโครงเรื่องต้องมี: ชื่อโครงเรื่อง, hook, รูปแบบการเล่า และความเสี่ยงที่ผู้เขียนควรระวัง',
    'ทั้ง 3 โครงต้องมีแกนความขัดแย้งและทิศทางตอนจบต่างกันอย่างชัดเจน',
    'ตอบเป็นภาษาไทย กระชับ และพร้อมนำไปพัฒนาต่อ',
  ].join('\n');
}

export async function generatePitchOptions(project: NovelProject, customPrompt?: string) {
  const genres = project.idea.genres.join(' + ') || 'ดราม่า';
  const seed = project.idea.seedIdea || 'ตัวเอกต้องเผชิญความจริงที่เปลี่ยนชีวิต';
  const prompt = customPrompt?.trim() || buildPitchPrompt(project);

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

  return { options, job: addJob('pitch', prompt, `สร้างโครงเรื่อง ${options.length} แนวทาง`) };
}

export async function buildStoryBibleFromPitch(project: NovelProject, pitch: PitchOption) {
  const prompt = `Build story bible from pitch: ${pitch.title}`;
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

  const targetChapterCount = Math.max(1, project.idea.chapterCount || project.chapters.length);
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

  return { bible, chapters, job: addJob('bible', prompt, bible.premise) };
}

export async function draftChapter(project: NovelProject, chapter: ChapterPlan) {
  const prompt = `Draft chapter ${chapter.number}: ${chapter.title}`;
  const memory = project.bible.canonMemory.slice(-4).join('\n- ');
  const text = `# ตอนที่ ${chapter.number}: ${chapter.title}

รินหยุดยืนอยู่หน้าหน้าต่างที่สะท้อนเงาของตัวเองซ้อนกับเมืองยามค่ำคืน เสียงฝนเคาะกระจกเป็นจังหวะเดียวกับหัวใจที่เต้นไม่เป็นระเบียบ ตั้งแต่เธอพบร่องรอยล่าสุด ทุกอย่างที่เคยมั่นใจก็เริ่มหลุดออกจากกันเหมือนด้ายที่ถูกดึงผิดเส้น

เป้าหมายของเธอในคืนนี้ชัดเจน: ${chapter.goal} แต่ความชัดเจนนั้นไม่ได้ทำให้ทางข้างหน้าง่ายขึ้น เพราะ ${chapter.conflict}

คีรินวางสมุดเก่าลงบนโต๊ะอย่างระวัง ราวกับมันเป็นสิ่งมีชีวิตที่อาจตื่นขึ้นมาได้ทุกเมื่อ "ถ้าเปิดหน้านี้แล้ว เธออาจจำบางอย่างได้" เขาพูดเบา ๆ "แต่ฉันไม่แน่ใจว่าเธอจะอยากจำมันจริงหรือเปล่า"

รินอยากถามว่าทำไมเขาถึงทำเหมือนรู้คำตอบอยู่แล้ว แต่สายตาของเขามีความเหนื่อยล้าที่เธอไม่เคยเห็นมาก่อน ความโกรธที่เตรียมไว้จึงกลายเป็นความเงียบ เธอเปิดสมุดด้วยมือที่เย็นเฉียบ และพบข้อความสั้น ๆ ที่เขียนด้วยลายมือของตัวเอง

"อย่าเชื่อความทรงจำแรกที่กลับมา"

ผลลัพธ์ของคืนนี้คือ ${chapter.outcome} แต่แทนที่มันจะทำให้ทุกอย่างกระจ่าง มันกลับเปิดช่องว่างใหม่ระหว่างรินกับคนที่เธออยากไว้ใจที่สุด

ก่อนที่เธอจะพูดอะไร ไฟทั้งห้องดับลงพร้อมกัน เสียงของเด็กผู้หญิงคนหนึ่งดังขึ้นจากหน้าสมุด ทั้งที่ไม่มีใครอยู่ตรงนั้น

"ถ้าเธอจำเขาได้ เขาจะหายไปอีกครั้ง"

${chapter.cliffhanger}

บริบท canon ล่าสุดที่ต้องคุม:
- ${memory || 'ยังไม่มี canon จากตอนก่อนหน้า'}`;

  return { text, job: addJob('chapter', prompt, text.slice(0, 120)) };
}

export async function rewriteChapter(project: NovelProject, chapter: ChapterPlan) {
  const prompt = `Rewrite chapter ${chapter.number} for style and pacing`;
  const source = chapter.draft || chapter.mainText;
  const text = `${source}

---
ฉบับปรับสำนวน: เพิ่มน้ำหนักอารมณ์ในฉากตัดสินใจ ลดการอธิบายซ้ำ และทำให้ประโยคท้ายตอนมีแรงดึงมากขึ้น`;

  return { text, job: addJob('rewrite', prompt, text.slice(-160)) };
}

export async function reviseChapterFromReviews(project: NovelProject, chapter: ChapterPlan, reviews: ReviewItem[]) {
  const source = chapter.draft || chapter.mainText;
  const prompt = `Revise chapter ${chapter.number} using selected review items: ${reviews.map((item) => item.area).join(', ')}`;
  const revisions = reviews.map((item) => {
    if (item.area === 'continuity') return `ผลของเหตุการณ์ครั้งนี้เปลี่ยนสิ่งที่ตัวละครรู้และส่งผลต่อความสัมพันธ์อย่างชัดเจน: ${chapter.outcome}`;
    if (item.area === 'pacing') return 'การตัดสินใจเกิดขึ้นทันทีหลังแรงกดดันเพิ่มขึ้น ทำให้ฉากเดินหน้าโดยไม่อธิบายเหตุการณ์เดิมซ้ำ';
    if (item.area === 'hook') return `ก่อนจบตอน หลักฐานใหม่ทำให้คำถามเดิมเปลี่ยนไป และชี้ตรงไปยังสิ่งที่รออยู่ในตอนถัดไป: ${chapter.cliffhanger}`;
    if (item.area === 'logic') return 'เหตุและผลของการตัดสินใจถูกเชื่อมเข้ากับกฎของโลกและข้อจำกัดที่ตัวละครไม่สามารถหลีกเลี่ยงได้';
    if (item.area === 'character') return 'การกระทำของตัวละครสะท้อนทั้งเป้าหมายส่วนตัวและความกลัวที่ทำให้การเลือกครั้งนี้มีราคาต้องจ่าย';
    return 'สำนวนถูกปรับให้กระชับขึ้น ลดคำอธิบายซ้ำ และคงน้ำเสียงเดียวกับส่วนก่อนหน้า';
  });
  const text = `${source.trim()}\n\n${revisions.join('\n\n')}`;

  return { text, job: addJob('rewrite', prompt, `แก้ไข ${reviews.length} ประเด็นจาก Quality Review`) };
}

export async function reviewChapter(project: NovelProject, chapter: ChapterPlan) {
  const prompt = `Review chapter ${chapter.number} across continuity, logic, character, style, pacing, hook`;
  const hasDraft = Boolean(chapter.draft || chapter.mainText);
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

  return { items, job: addJob('review', prompt, `${items.length} review items`) };
}

export function summarizeCanonUpdate(chapter: ChapterPlan) {
  return [
    `ตอน ${chapter.number}: ${chapter.title} ถูกบันทึกเป็นตอนหลัก`,
    `ผลลัพธ์หลัก: ${chapter.outcome}`,
    `ปมท้ายตอน: ${chapter.cliffhanger}`,
  ];
}
