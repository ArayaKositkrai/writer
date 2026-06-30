import { AiSettings, ChapterPlan, NovelProject, WorkflowStep } from '../types';
import IdeaPage from './IdeaPage';
import PitchPage from './PitchPage';
import StoryBiblePage from './StoryBiblePage';
import ChapterBoardPage from './ChapterBoardPage';
import ChapterWriterPage from './ChapterWriterPage';
import ExportPage from './ExportPage';

interface WorkflowRouteViewProps {
  step: WorkflowStep;
  project: NovelProject;
  chapter: ChapterPlan;
  aiSettings: AiSettings;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
  onNotice: (notice: string) => void;
}

function WorkflowRouteView({ step, project, chapter, aiSettings, updateProject, goToStep, onNotice }: WorkflowRouteViewProps) {
  if (step === 'idea') return <IdeaPage project={project} updateProject={updateProject} goToStep={goToStep} />;
  if (step === 'pitch') return <PitchPage project={project} aiSettings={aiSettings} updateProject={updateProject} goToStep={goToStep} onNotice={onNotice} />;
  if (step === 'bible') return <StoryBiblePage project={project} updateProject={updateProject} goToStep={goToStep} />;
  if (step === 'board') return <ChapterBoardPage project={project} updateProject={updateProject} goToStep={goToStep} />;
  if (step === 'writer') {
    return <ChapterWriterPage project={project} chapter={chapter} aiSettings={aiSettings} updateProject={updateProject} goToStep={goToStep} onNotice={onNotice} />;
  }
  return <ExportPage project={project} updateProject={updateProject} goToStep={goToStep} />;
}

export default WorkflowRouteView;
