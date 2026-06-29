import { ChapterPlan, NovelProject, WorkflowStep } from '../types';
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
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function WorkflowRouteView({ step, project, chapter, updateProject, goToStep }: WorkflowRouteViewProps) {
  if (step === 'idea') return <IdeaPage project={project} updateProject={updateProject} goToStep={goToStep} />;
  if (step === 'pitch') return <PitchPage project={project} updateProject={updateProject} goToStep={goToStep} />;
  if (step === 'bible') return <StoryBiblePage project={project} updateProject={updateProject} goToStep={goToStep} />;
  if (step === 'board') return <ChapterBoardPage project={project} updateProject={updateProject} goToStep={goToStep} />;
  if (step === 'writer') {
    return <ChapterWriterPage project={project} chapter={chapter} updateProject={updateProject} goToStep={goToStep} />;
  }
  return <ExportPage project={project} updateProject={updateProject} goToStep={goToStep} />;
}

export default WorkflowRouteView;
