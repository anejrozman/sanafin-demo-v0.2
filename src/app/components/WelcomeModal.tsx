import { useState, Fragment } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowRight, Database, Target, ScrollText, Banknote } from 'lucide-react';
import sanafinLogo from '../../assets/sanafin_logo.png';

interface WelcomePageProps {
  open: boolean;
  onClose: () => void;
  onStartUpload: (workflow: string) => void;
  onGoToUpload: (workflow: string) => void;
}

const steps = [
  {
    icon: Database,
    label: 'Upload Patient Data',
    color: 'bg-brand-teal',
  },
  {
    icon: Target,
    label: 'Configure Treatment Objectives',
    color: 'bg-violet-500',
  },
  {
    icon: ScrollText,
    label: 'Specify Payment Agreement',
    color: 'bg-brand-amber',
  },
  {
    icon: Banknote,
    label: 'Manage Ongoing Treatment and Automate Settlement',
    color: 'bg-emerald-600',
  },
];

export default function WelcomePage({
  open,
  onClose,
  onStartUpload,
  onGoToUpload,
}: WelcomePageProps) {
  const [workflow, setWorkflow] = useState('metabolic');
  const actionsDisabled = workflow !== 'metabolic';

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="max-w-6xl sm:max-w-6xl w-[90vw] min-h-[85vh] p-10 sm:rounded-xl glass-panel shadow-2xl bg-background/95 border-foreground/5 overflow-hidden bg-dot-grid">
        <div className="flex flex-col gap-6 relative z-10 h-full min-h-[calc(85vh-5rem)]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-foreground/5">
            <img src={sanafinLogo} alt="SanaFin" className="h-16 w-auto flex-shrink-0 transition-transform hover:scale-105 duration-300" />
            <div className="flex flex-col gap-1 flex-1 text-center sm:text-left">
              <DialogTitle className="text-xl font-black tracking-tight text-foreground">Sanafin EDEN Framework Outcome Studio</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-1 font-semibold">
                Sanafin connects health data, outcome verification, and automated settlement into one trusted workflow based on the EDEN Framework.
              </DialogDescription>
            </div>
          </div>

          {/* Intro text */}
          <p className="text-sm text-foreground/80 leading-relaxed font-medium text-center sm:text-left">
            The demo focuses on guiding the user through the clinical workflow of managing a cohort of patients undergoing treatment and showcases how settlement for their care is handled through SanaFin.
          </p>

          {/* Dropdown for Clinical Workflow */}
          <div className="flex flex-col gap-2 max-w-sm mx-auto w-full text-left bg-muted/40 p-4 rounded-xl border border-foreground/5 shadow-inner glass-panel">
            <label htmlFor="clinical-workflow" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Clinical Workflow Template
            </label>
            <select
              id="clinical-workflow"
              value={workflow}
              onChange={(e) => setWorkflow(e.target.value)}
              className="w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-semibold transition-all"
            >
              <option value="metabolic">Metabolic Health (Demo)</option>
              <option value="cardiovascular">Cardiovascular Health (Coming Soon)</option>
              <option value="manual">Manual Workflow (Custom Targets)</option>
            </select>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
              {workflow === 'manual'
                ? 'Manual selection will prompt target configuration right away.'
                : 'Auto-loads default outcome targets for diabetes prevention.'}
            </p>
          </div>

          {/* Clinical Workflow section */}
          <div className="flex flex-col items-center py-2 flex-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Clinical Workflow
            </p>

            {workflow === 'metabolic' && (
              <>
                <div className="flex items-stretch gap-2.5 w-full max-w-2xl">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <Fragment key={step.label}>
                        <div className="flex-1 flex flex-col items-center gap-3 rounded-xl border border-foreground/5 p-4 bg-background/60 shadow-xs hover-glass-card glass-panel">
                          <div className={`size-11 rounded-full ${step.color} flex items-center justify-center text-white glow-teal-sm`}>
                            <Icon className="size-5" />
                          </div>
                          <span className="text-xs font-bold text-foreground text-center">{step.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex items-center">
                            <ArrowRight className="size-4 text-muted-foreground/60 flex-shrink-0" />
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
                <div className="mt-6 space-y-2.5 text-xs text-muted-foreground w-full max-w-2xl font-semibold">
                  <div className="flex gap-2">
                    <span className="font-bold text-brand-teal shrink-0">1.</span>
                    <span>Upload a patient cohort CSV with clinical measurements — HbA1c, CGM time-in-range, weight, and coaching attendance.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-violet-500 shrink-0">2.</span>
                    <span>Set treatment outcome targets — the clinical thresholds each patient must meet for the treatment to be considered successful.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-brand-amber shrink-0">3.</span>
                    <span>Define the escrow structure: total contract value, base vs. performance split, and the per-patient settlement amount at stake.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">4.</span>
                    <span>Track patient progress in real time and trigger automated escrow payouts or clawbacks based on verified clinical outcomes.</span>
                  </div>
                </div>
              </>
            )}

            {workflow === 'cardiovascular' && (
              <div className="flex items-center justify-center w-full max-w-2xl flex-1 rounded-xl border border-foreground/5 bg-background/60 glass-panel">
                <p className="text-sm font-semibold text-muted-foreground">Cardiovascular health template coming soon.</p>
              </div>
            )}

            {workflow === 'manual' && (
              <div className="flex items-center justify-center w-full max-w-2xl flex-1 rounded-xl border border-foreground/5 bg-background/60 glass-panel">
                <p className="text-sm font-semibold text-muted-foreground">Manual workflow tools coming soon.</p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center border-t border-foreground/5 pt-4">
            <Button
              variant="secondary"
              className="font-bold"
              disabled={actionsDisabled}
              onClick={() => onGoToUpload(workflow)}
            >
              Upload patient data
            </Button>
            <Button
              className="font-bold bg-brand-teal hover:bg-brand-teal/90 glow-teal-sm text-white px-5 py-2.5 rounded-lg transition-all"
              disabled={actionsDisabled}
              onClick={() => onStartUpload(workflow)}
            >
              Start with sample data
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useWelcomeModal() {
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
  };

  const reopen = () => {
    setOpen(true);
  };

  return { open, close, reopen };
}
