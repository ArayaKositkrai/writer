import StoryBible from '../components/StoryBible';
import { NovelProject, WorkflowStep } from '../types';

interface StoryBiblePageProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function StoryBiblePage(props: StoryBiblePageProps) {
  return <StoryBible {...props} />;
}

export default StoryBiblePage;
