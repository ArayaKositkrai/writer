// src/pages/PitchPage.tsx

import PitchLab from '../components/PitchLab';
import { AiSettings, NovelProject, WorkflowStep } from '../types';

interface PitchPageProps {
  project: NovelProject;
  aiSettings: AiSettings;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
  onNotice: (notice: string) => void;
}

function PitchPage(props: PitchPageProps) {
  return <PitchLab {...props} />;
}

export default PitchPage;
