export type WorkflowStep =
  | 'idea'
  | 'pitch'
  | 'bible'
  | 'board'
  | 'writer'
  | 'export';

export type ChapterStatus = 'planned' | 'drafting' | 'reviewing' | 'needs_revision' | 'main';

export type AiMode = 'guided' | 'high_auto' | 'manual_first';

export type OperationMode = 'mock' | 'manual' | 'api';

export interface AiSettings {
  operationMode: OperationMode;
  provider: 'gemini' | 'openai';
  model: string;
  apiKeyConfigured: boolean;
}

export interface IdeaSettings {
  genres: string[];
  seedIdea: string;
  targetReaders: string;
  chapterCount: number;
  wordsPerChapter: string;
  tone: string;
  aiMode: AiMode;
  authorNotes: string;
}

export interface PitchOption {
  id: string;
  title: string;
  hook: string;
  style: string;
  risk: string;
  selected?: boolean;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  goal: string;
  conflict: string;
  arc: string;
}

export interface StoryBible {
  premise: string;
  worldRules: string;
  styleGuide: string;
  characters: CharacterProfile[];
  timeline: string[];
  mysteries: string[];
  canonMemory: string[];
}

export interface ChapterPlan {
  id: string;
  number: number;
  title: string;
  summary: string;
  goal: string;
  conflict: string;
  outcome: string;
  cliffhanger: string;
  status: ChapterStatus;
  draft: string;
  mainText: string;
  canonUpdates: string[];
  updatedAt: string;
}

export interface ReviewItem {
  id: string;
  area: 'continuity' | 'logic' | 'character' | 'style' | 'pacing' | 'hook';
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
  suggestion: string;
  resolved: boolean;
}

export interface GenerationJob {
  id: string;
  type: 'pitch' | 'bible' | 'chapter' | 'review' | 'rewrite';
  status: 'done' | 'failed';
  prompt: string;
  resultPreview: string;
  createdAt: string;
}

export interface NovelProject {
  id: string;
  ownerMode: 'guest' | 'account';
  title: string;
  updatedAt: string;
  idea: IdeaSettings;
  pitches: PitchOption[];
  selectedPitchId?: string;
  bible: StoryBible;
  chapters: ChapterPlan[];
  reviews: Record<string, ReviewItem[]>;
  jobs: GenerationJob[];
  currentChapterId: string;
}

export interface ProjectStore {
  activeProjectId: string;
  projects: NovelProject[];
}
