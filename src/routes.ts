// src/routes.ts

import { WorkflowStep } from './types';

export interface WorkflowRoute {
  step: WorkflowStep;
  path: string;
  label: string;
  shortLabel: string;
}

export const workflowRoutes: WorkflowRoute[] = [
  { step: 'idea', path: '/idea-base', label: 'Idea Base', shortLabel: 'ตั้งค่าเรื่อง' },
  { step: 'pitch', path: '/pitch-lab', label: 'Pitch Lab', shortLabel: 'เลือกพล็อต' },
  { step: 'bible', path: '/story-bible', label: 'Story Bible', shortLabel: 'โครงทั้งเรื่อง' },
  { step: 'board', path: '/chapter-board', label: 'Chapter Board', shortLabel: 'เลือกตอน' },
  { step: 'writer', path: '/chapter-writer', label: 'Chapter Writer', shortLabel: 'เขียนตอน' },
  { step: 'export', path: '/export', label: 'Export', shortLabel: 'บันทึกตอน' },
];

export const loginPath = '/login';

export function normalizePath(pathname: string) {
  if (pathname === '/' || pathname === '') return '/idea-base';
  return pathname;
}

export function routeForStep(step: WorkflowStep) {
  return workflowRoutes.find((route) => route.step === step) ?? workflowRoutes[0];
}

export function stepForPath(pathname: string) {
  const normalized = normalizePath(pathname);
  return workflowRoutes.find((route) => route.path === normalized)?.step ?? 'idea';
}
