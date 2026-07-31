// src/pages/IdeaPage.tsx

import IdeaBase from '../components/IdeaBase';
import { NovelProject, WorkflowStep } from '../types';

interface IdeaPageProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function IdeaPage(props: IdeaPageProps) {
  return <IdeaBase {...props} />;
}

export default IdeaPage;
