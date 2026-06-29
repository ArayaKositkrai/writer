import ChapterWriter from '../components/ChapterWriter';
import { ChapterPlan, NovelProject, WorkflowStep } from '../types';

interface ChapterWriterPageProps {
  project: NovelProject;
  chapter: ChapterPlan;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function ChapterWriterPage(props: ChapterWriterPageProps) {
  return <ChapterWriter {...props} />;
}

export default ChapterWriterPage;
