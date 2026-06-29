import PitchLab from '../components/PitchLab';
import { NovelProject, WorkflowStep } from '../types';

interface PitchPageProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function PitchPage(props: PitchPageProps) {
  return <PitchLab {...props} />;
}

export default PitchPage;
