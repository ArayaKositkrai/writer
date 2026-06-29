import ExportPanel from '../components/ExportPanel';
import { NovelProject, WorkflowStep } from '../types';

interface ExportPageProps {
  project: NovelProject;
  updateProject: (updater: (project: NovelProject) => NovelProject, notice?: string) => void;
  goToStep: (step: WorkflowStep) => void;
}

function ExportPage({ project, updateProject, goToStep }: ExportPageProps) {
  return <ExportPanel project={project} updateProject={updateProject} goToStep={goToStep} />;
}

export default ExportPage;
