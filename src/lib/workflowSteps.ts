import { Workflow, Database, Target, ScrollText, Banknote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  color: string;
  hoverColor: string;
}

export const STEPS: WorkflowStep[] = [
  {
    id: 'select-workflow',
    label: 'Select Workflow',
    description: 'Choose a clinical workflow template to begin your outcome verification process.',
    Icon: Workflow,
    color: 'bg-slate-600',
    hoverColor: 'hover:bg-slate-500',
  },
  {
    id: 'upload-section',
    label: 'Upload Patient Data',
    description: 'Upload your patient cohort CSV with baseline clinical measurements — HbA1c, CGM time-in-range, weight, and coaching attendance.',
    Icon: Database,
    color: 'bg-brand-teal',
    hoverColor: 'hover:bg-brand-teal/90',
  },
  {
    id: 'configure-objectives',
    label: 'Configure Treatment Objectives',
    description: 'Set outcome targets — the clinical thresholds each patient must meet for the treatment to be considered successful.',
    Icon: Target,
    color: 'bg-violet-500',
    hoverColor: 'hover:bg-violet-400',
  },
  {
    id: 'payment-agreement',
    label: 'Specify Payment Agreement',
    description: 'Define the escrow structure: total contract value, base vs. performance split, and the per-patient settlement amount at stake.',
    Icon: ScrollText,
    color: 'bg-brand-amber',
    hoverColor: 'hover:bg-brand-amber/90',
  },
  {
    id: 'manage-treatment',
    label: 'Manage Ongoing Treatment',
    description: 'Track patient progress in real time and trigger automated escrow payouts or clawbacks based on verified clinical outcomes.',
    Icon: Banknote,
    color: 'bg-emerald-600',
    hoverColor: 'hover:bg-emerald-500',
  },
];
