import { ChapterPlan, NovelProject } from '../types';

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\s+/g, ' ').trim() || 'untitled';
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

${chapter.mainText || chapter.draft || 'ยังไม่มีต้นฉบับสำหรับตอนนี้'}
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

export function projectToMarkdown(project: NovelProject) {
  const mainChapters = project.chapters.filter((chapter) => chapter.mainText || chapter.draft);

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
  .map((chapter) => `### ตอนที่ ${chapter.number}: ${chapter.title}\n\n${chapter.mainText || chapter.draft}`)
  .join('\n\n')}
`;
}

export function downloadProjectMarkdown(project: NovelProject) {
  download(`${safeFilename(project.title || 'novel-manuscript')}.md`, projectToMarkdown(project), 'text/markdown;charset=utf-8');
}
