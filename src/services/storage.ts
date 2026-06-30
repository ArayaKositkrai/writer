import { AiSettings, ProjectStore, NovelProject } from '../types';
import { createChapter, createDefaultProject } from '../data/defaultProject';
import { hasApiKey } from './credentials';

const STORAGE_KEY = 'novel_studio_project_store_v1';
const AI_SETTINGS_KEY = 'novel_studio_ai_settings_v1';

export const defaultAiSettings: AiSettings = {
  operationMode: 'mock',
  provider: 'gemini',
  model: 'gemini-3.5-flash',
  apiKeyConfigured: false,
};

export function loadStore(): ProjectStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const project = createDefaultProject();
      return { activeProjectId: project.id, projects: [project] };
    }

    const parsed = JSON.parse(raw) as ProjectStore;
    if (!parsed.projects?.length) {
      const project = createDefaultProject();
      return { activeProjectId: project.id, projects: [project] };
    }
    return parsed;
  } catch {
    const project = createDefaultProject();
    return { activeProjectId: project.id, projects: [project] };
  }
}

export function saveStore(store: ProjectStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadAiSettings(): AiSettings {
  try {
    const loaded = { ...defaultAiSettings, ...JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) || '{}') } as AiSettings;
    const deprecatedGeminiModel = loaded.provider === 'gemini' && /^(gemini-1\.|gemini-2\.0)/.test(loaded.model);
    return {
      ...loaded,
      model: deprecatedGeminiModel ? defaultAiSettings.model : loaded.model,
      apiKeyConfigured: hasApiKey(loaded.provider),
    };
  } catch {
    return { ...defaultAiSettings, apiKeyConfigured: hasApiKey(defaultAiSettings.provider) };
  }
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

export function replaceActiveProject(store: ProjectStore, project: NovelProject): ProjectStore {
  return {
    activeProjectId: project.id,
    projects: store.projects.map((item) => (item.id === project.id ? project : item)),
  };
}

export function addProject(store: ProjectStore, project: NovelProject): ProjectStore {
  return {
    activeProjectId: project.id,
    projects: [project, ...store.projects],
  };
}

export function deleteProject(store: ProjectStore, projectId: string): ProjectStore {
  const remaining = store.projects.filter((project) => project.id !== projectId);
  if (remaining.length === 0) {
    const project = createDefaultProject();
    return { activeProjectId: project.id, projects: [project] };
  }

  return {
    activeProjectId: store.activeProjectId === projectId ? remaining[0].id : store.activeProjectId,
    projects: remaining,
  };
}

function importProjectJson(content: string): NovelProject {
  const parsed = JSON.parse(content) as NovelProject;
  if (!parsed.id || !parsed.title || !parsed.chapters) {
    throw new Error('ไฟล์นี้ไม่ใช่ project JSON ที่ถูกต้อง');
  }
  return { ...parsed, updatedAt: new Date().toISOString() };
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim() || 'นำเข้าจาก Markdown';
}

function sectionAfterHeading(markdown: string, headingPattern: RegExp) {
  const match = headingPattern.exec(markdown);
  return match ? markdown.slice(match.index + match[0].length).trim() : markdown.trim();
}

function parseMarkdownChapters(markdown: string) {
  const chapterHeading = /^###\s*(?:(?:ตอนที่|à¸•à¸­à¸™à¸—à¸µà¹ˆ)\s*)?(\d+)\s*[:：.-]?\s*(.*)$/gim;
  const matches = [...markdown.matchAll(chapterHeading)];
  if (!matches.length) return [];

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index ?? markdown.length : markdown.length;
      const number = Number(match[1]) || index + 1;
      const fallbackTitle = `ตอนที่ ${number}`;
      return {
        number,
        title: (match[2] || fallbackTitle).trim() || fallbackTitle,
        content: markdown.slice(start, end).trim(),
      };
    })
    .filter((chapter) => chapter.content);
}

function importProjectMarkdown(content: string, fileName: string): NovelProject {
  const now = new Date().toISOString();
  const base = createDefaultProject();
  const titleMatch = /^#\s+(.+)$/m.exec(content);
  const title = titleMatch?.[1]?.trim() || titleFromFileName(fileName);
  const manuscript = sectionAfterHeading(content, /^##\s*(?:ต้นฉบับ|Manuscript|à¸•à¹‰à¸™à¸‰à¸šà¸±à¸š)\s*$/im);
  const parsedChapters = parseMarkdownChapters(manuscript);

  const chapters = parsedChapters.length
    ? parsedChapters.map((item, index) => ({
        ...createChapter(index + 1),
        id: `chapter_${index + 1}`,
        number: index + 1,
        title: item.title,
        summary: 'นำเข้าจากไฟล์ Markdown',
        status: 'main' as const,
        draft: item.content,
        mainText: item.content,
        updatedAt: now,
      }))
    : [
        {
          ...createChapter(1),
          title: 'ต้นฉบับนำเข้า',
          summary: 'นำเข้าจากไฟล์ Markdown',
          status: 'main' as const,
          draft: content.trim(),
          mainText: content.trim(),
          updatedAt: now,
        },
      ];

  return {
    ...base,
    title,
    updatedAt: now,
    idea: {
      ...base.idea,
      seedIdea: `นำเข้าจากไฟล์ ${fileName}`,
      chapterCount: chapters.length,
    },
    bible: {
      ...base.bible,
      premise: title,
      canonMemory: [`นำเข้าจากไฟล์ Markdown: ${fileName}`],
    },
    chapters,
    currentChapterId: chapters[0].id,
  };
}

export function importProjectFile(file: File): Promise<NovelProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = String(reader.result);
        const name = file.name.toLowerCase();
        const isMarkdown = name.endsWith('.md') || file.type === 'text/markdown';
        resolve(isMarkdown ? importProjectMarkdown(content, file.name) : importProjectJson(content));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
