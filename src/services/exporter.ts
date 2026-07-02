import { ChapterPlan, NovelProject } from '../types';
import { isRichText, richTextToMarkdown, richTextToPlainText } from './richText';

type DocxModule = typeof import('docx');

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function download(filename: string, content: string, type: string) {
  downloadBlob(filename, new Blob([content], { type }));
}

function safeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\s+/g, ' ').trim() || 'untitled';
}

function chapterContent(chapter: ChapterPlan) {
  return chapter.status === 'main'
    ? chapter.mainText || chapter.draft
    : chapter.draft || chapter.mainText;
}

const DOCX_FONT = 'TH Sarabun New';
const DOCX_BODY_SIZE = 32;

function textParagraph(docx: DocxModule, text: string, options: { bold?: boolean; pageBreakBefore?: boolean } = {}) {
  return new docx.Paragraph({
    pageBreakBefore: options.pageBreakBefore,
    spacing: { after: 120, line: 360 },
    children: [new docx.TextRun({ text, bold: options.bold, font: DOCX_FONT, size: DOCX_BODY_SIZE })],
  });
}

function bodyParagraphs(docx: DocxModule, text: string) {
  if (isRichText(text) && typeof DOMParser !== 'undefined') {
    const parsed = new DOMParser().parseFromString(text, 'text/html');
    const blocks = Array.from(parsed.body.children);
    return blocks.map((block) => {
      const runs: import('docx').TextRun[] = [];
      const appendRuns = (node: Node, bold = false, italics = false) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent) runs.push(new docx.TextRun({ text: node.textContent, bold, italics, font: DOCX_FONT, size: DOCX_BODY_SIZE }));
          return;
        }
        if (!(node instanceof HTMLElement)) return;
        if (node.tagName === 'BR') {
          runs.push(new docx.TextRun({ break: 1, font: DOCX_FONT, size: DOCX_BODY_SIZE }));
          return;
        }
        const nextBold = bold || node.tagName === 'STRONG' || node.tagName === 'B';
        const nextItalics = italics || node.tagName === 'EM' || node.tagName === 'I';
        node.childNodes.forEach((child) => appendRuns(child, nextBold, nextItalics));
      };
      appendRuns(block);

      const element = block as HTMLElement;
      const lineHeight = Number.parseFloat(element.style.lineHeight || '1.5');
      const marginPixels = Number.parseFloat(element.style.marginLeft || '0');
      const heading = element.tagName === 'H2'
        ? docx.HeadingLevel.HEADING_2
        : element.tagName === 'H3'
          ? docx.HeadingLevel.HEADING_3
          : undefined;
      if (element.tagName === 'LI') runs.unshift(new docx.TextRun({ text: '• ', font: DOCX_FONT, size: DOCX_BODY_SIZE }));
      return new docx.Paragraph({
        heading,
        spacing: { after: 120, line: Math.round(240 * (Number.isFinite(lineHeight) ? lineHeight : 1.5)) },
        indent: element.tagName === 'BLOCKQUOTE' || marginPixels > 0 ? { left: Math.max(720, Math.round(marginPixels * 15)) } : undefined,
        children: runs.length ? runs : [new docx.TextRun({ text: '', font: DOCX_FONT, size: DOCX_BODY_SIZE })],
      });
    });
  }
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.trim()) return [textParagraph(docx, 'ยังไม่มีต้นฉบับสำหรับตอนนี้')];
  return normalized.split('\n').map((line) => textParagraph(docx, line));
}

function chapterDocxParagraphs(docx: DocxModule, chapter: ChapterPlan, pageBreakBefore = false) {
  return [
    new docx.Paragraph({
      text: `ตอนที่ ${chapter.number}: ${chapter.title}`,
      heading: docx.HeadingLevel.HEADING_1,
      pageBreakBefore,
      spacing: { after: 240 },
    }),
    textParagraph(docx, `เรื่องย่อ: ${chapter.summary || '-'}`),
    textParagraph(docx, `เป้าหมาย: ${chapter.goal || '-'}`),
    textParagraph(docx, `ความขัดแย้ง: ${chapter.conflict || '-'}`),
    textParagraph(docx, `ผลลัพธ์: ${chapter.outcome || '-'}`),
    textParagraph(docx, `จุดทิ้งท้าย: ${chapter.cliffhanger || '-'}`),
    new docx.Paragraph({ text: 'ต้นฉบับ', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 240, after: 180 } }),
    ...bodyParagraphs(docx, chapterContent(chapter)),
  ];
}

function createDocx(docx: DocxModule, project: NovelProject, chapters: ChapterPlan[]) {
  const children: import('docx').Paragraph[] = [
    new docx.Paragraph({
      text: project.title || 'นิยายไม่มีชื่อ',
      heading: docx.HeadingLevel.TITLE,
      alignment: docx.AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
  ];

  if (chapters.length > 1) {
    if (project.bible.premise.trim()) children.push(textParagraph(docx, project.bible.premise));
    children.push(new docx.Paragraph({ text: 'ต้นฉบับ', heading: docx.HeadingLevel.HEADING_1, pageBreakBefore: true }));
  }

  chapters.forEach((chapter, index) => {
    children.push(...chapterDocxParagraphs(docx, chapter, chapters.length > 1 && index > 0));
  });

  return new docx.Document({
    creator: 'Novel Studio',
    title: project.title,
    description: 'ต้นฉบับนิยายจาก Novel Studio',
    sections: [{
      properties: {
        page: {
          margin: { top: 1_440, right: 1_440, bottom: 1_440, left: 1_440 },
        },
      },
      children,
    }],
  });
}

export function downloadProjectJson(project: NovelProject) {
  download(`${safeFilename(project.title || 'novel-project')}.json`, JSON.stringify(project, null, 2), 'application/json;charset=utf-8');
}

export function chapterToMarkdown(project: NovelProject, chapter: ChapterPlan) {
  return `# ${project.title}

## ตอนที่ ${chapter.number}: ${chapter.title}

### โครงตอน
- เรื่องย่อ: ${chapter.summary}
- เป้าหมาย: ${chapter.goal}
- ความขัดแย้ง: ${chapter.conflict}
- ผลลัพธ์: ${chapter.outcome}
- จุดทิ้งท้าย: ${chapter.cliffhanger}

### ต้นฉบับ

${richTextToMarkdown(chapterContent(chapter)) || 'ยังไม่มีต้นฉบับสำหรับตอนนี้'}
`;
}

export function downloadChapterMarkdown(project: NovelProject, chapter: ChapterPlan) {
  const filename = `${String(chapter.number).padStart(3, '0')}-${safeFilename(chapter.title)}.md`;
  download(filename, chapterToMarkdown(project, chapter), 'text/markdown;charset=utf-8');
}

export function downloadChapterJson(project: NovelProject, chapter: ChapterPlan) {
  const filename = `${String(chapter.number).padStart(3, '0')}-${safeFilename(chapter.title)}.json`;
  download(filename, JSON.stringify({ projectId: project.id, projectTitle: project.title, chapter }, null, 2), 'application/json;charset=utf-8');
}

export async function downloadChapterDocx(project: NovelProject, chapter: ChapterPlan) {
  const filename = `${String(chapter.number).padStart(3, '0')}-${safeFilename(chapter.title)}.docx`;
  const blob = await chapterToDocxBlob(project, chapter);
  downloadBlob(filename, blob);
}

export async function chapterToDocxBlob(project: NovelProject, chapter: ChapterPlan) {
  const docx = await import('docx');
  return docx.Packer.toBlob(createDocx(docx, project, [chapter]));
}

export function projectToMarkdown(project: NovelProject) {
  const mainChapters = project.chapters.filter((chapter) => richTextToPlainText(chapterContent(chapter)).trim());

  return `# ${project.title}

## คำโปรย / Premise
${project.bible.premise}

## แนวคิดตั้งต้น
${project.idea.seedIdea}

## Story Bible

### กฎโลก
${project.bible.worldRules}

### Style Guide
${project.bible.styleGuide}

### ตัวละคร
${project.bible.characters
  .map((char) => `- **${char.name}** (${char.role})\n  - เป้าหมาย: ${char.goal}\n  - ความขัดแย้ง: ${char.conflict}\n  - เส้นทางพัฒนา: ${char.arc}`)
  .join('\n')}

### Timeline
${project.bible.timeline.map((item, index) => `${index + 1}. ${item}`).join('\n')}

### ปมที่ยังต้องคุม
${project.bible.mysteries.map((item) => `- ${item}`).join('\n')}

## โครงตอน
${project.chapters
  .map(
    (chapter) => `### ตอนที่ ${chapter.number}: ${chapter.title}
${chapter.summary}
- เป้าหมาย: ${chapter.goal}
- ความขัดแย้ง: ${chapter.conflict}
- ผลลัพธ์: ${chapter.outcome}
- Cliffhanger: ${chapter.cliffhanger}`,
  )
  .join('\n\n')}

## ต้นฉบับ
${mainChapters
  .map((chapter) => `### ตอนที่ ${chapter.number}: ${chapter.title}\n\n${richTextToMarkdown(chapterContent(chapter))}`)
  .join('\n\n')}
`;
}

export function downloadProjectMarkdown(project: NovelProject) {
  download(`${safeFilename(project.title || 'novel-manuscript')}.md`, projectToMarkdown(project), 'text/markdown;charset=utf-8');
}

export async function downloadProjectDocx(project: NovelProject) {
  const blob = await projectToDocxBlob(project);
  downloadBlob(`${safeFilename(project.title || 'novel-manuscript')}.docx`, blob);
}

export async function projectToDocxBlob(project: NovelProject) {
  const chapters = project.chapters.filter((chapter) => richTextToPlainText(chapterContent(chapter)).trim());
  if (!chapters.length) throw new Error('ยังไม่มีต้นฉบับสำหรับส่งออก');
  const docx = await import('docx');
  return docx.Packer.toBlob(createDocx(docx, project, chapters));
}
