import ChapterBoard from '../components/ChapterBoard';
import { NovelProject, WorkflowStep } from '../types';

interface ChapterBoardPageProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function ChapterBoardPage(props: ChapterBoardPageProps) {
  return <ChapterBoard {...props} />;
}

export default ChapterBoardPage;
