// src/pages/ChapterWriterPage.tsx

import ChapterWriter from '../components/ChapterWriter';
import { AiSettings, ChapterPlan, NovelProject, WorkflowStep } from '../types';

interface ChapterWriterPageProps {
  project: NovelProject;
  chapter: ChapterPlan;
  aiSettings: AiSettings;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
  onNotice: (notice: string) => void;
}

function ChapterWriterPage(props: ChapterWriterPageProps) {
  return <ChapterWriter {...props} />;
}

export default ChapterWriterPage;
