import { useState, Fragment } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowRight, Database, ShieldCheck, Banknote } from 'lucide-react';
import sanafinLogo from '../../assets/sanafin_logo.png';

interface WelcomePageProps {
  open: boolean;
  onClose: () => void;
  onStartUpload: (workflow: string) => void;
  onGoToUpload: (workflow: string) => void;
  onGoToDashboard: (workflow: string) => void;
}

const steps = [
  {
    icon: Database,
    label: 'Capture Outcomes',
    color: 'bg-brand-teal',
    textColor: 'text-brand-teal',
    borderColor: 'border-brand-teal/30',
    bg: 'bg-brand-teal/10',
  },
  {
    icon: ShieldCheck,
    label: 'Prove Impact',
    color: 'bg-brand-amber',
    textColor: 'text-brand-amber',
    borderColor: 'border-brand-amber/30',
    bg: 'bg-brand-amber/10',
  },
  {
    icon: Banknote,
    label: 'Automate Settlement',
    color: 'bg-brand-teal',
    textColor: 'text-brand-teal',
    borderColor: 'border-brand-teal/30',
    bg: 'bg-brand-teal/10',
  },
];

export default function WelcomePage({
  open,
  onClose,
  onStartUpload,
  onGoToUpload,
  onGoToDashboard,
}: WelcomePageProps) {
  const [workflow, setWorkflow] = useState('metabolic');

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="max-w-3xl sm:max-w-3xl p-6 sm:rounded-xl glass-panel shadow-2xl bg-background/95 border-foreground/5 overflow-hidden bg-dot-grid">
        <div className="flex flex-col gap-6 relative z-10">
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

          {/* Intro Text */}
          <div className="text-sm text-foreground/80 leading-relaxed text-center sm:text-left font-medium">
            <p>
              The demo focuses on outcome verification and reporting for type 2 diabetes treatment, demonstrating how trusted
              evidence becomes the foundation for outcome-based contracts.
            </p>
          </div>

          {/* Dropdown for Clinical Workflow */}
          <div className="flex flex-col gap-2 max-w-sm mx-auto w-full text-left bg-muted/40 p-4 rounded-xl border border-foreground/5 shadow-inner glass-panel">
            <label htmlFor="clinical-workflow" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Clinical Workflow Template
            </label>
            <select
              id="clinical-workflow"
              value={workflow}
              onChange={(e) => {
                const val = e.target.value;
                setWorkflow(val);
                if (val === 'cardiovascular') {
                  alert("Cardiovascular Health template is coming soon. Using Metabolic Health (Demo) for this session.");
                  setWorkflow('metabolic');
                }
              }}
              className="w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-semibold transition-all"
            >
              <option value="metabolic">Metabolic Health (Demo)</option>
              <option value="cardiovascular">Cardiovascular Health (Coming Soon)</option>
              <option value="manual">Manual Workflow (Custom Targets)</option>
            </select>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
              {workflow === 'manual' 
                ? '💡 Manual selection will prompt target configuration right away.' 
                : '💡 Auto-loads default outcome targets for diabetes prevention.'}
            </p>
          </div>

          {/* Three-step diagram */}
          <div className="flex flex-col items-center py-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              How it works
            </p>
            <div className="flex items-stretch gap-2.5 w-full max-w-2xl">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Fragment key={step.label}>
                    <div className={`flex-1 flex flex-col items-center gap-3 rounded-xl border border-foreground/5 p-4 bg-background/60 shadow-xs hover-glass-card glass-panel`}>
                      <div className={`size-11 rounded-full ${step.color} flex items-center justify-center text-white glow-teal-sm`}>
                        <Icon className="size-5" />
                      </div>
                      <span className={`text-xs font-bold text-foreground text-center`}>{step.label}</span>
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
                <span className="font-bold text-brand-teal">1.</span>
                <span>Capture: Connect telemetry clinical data (smart scales, CGM, medication sync).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-brand-teal">2.</span>
                <span>Verify: Prove impact by checking patient compliance against EDEN verification rules.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-brand-teal">3.</span>
                <span>Settle: Trigger automated escrow payouts or clawbacks based on smart contract settlement triggers.</span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap gap-3 mt-4 justify-end border-t border-foreground/5 pt-4">
            <Button variant="ghost" className="font-bold hover:bg-muted" onClick={() => onGoToDashboard(workflow)}>
              Go to Dashboard
            </Button>
            <Button variant="secondary" className="font-bold" onClick={() => onGoToUpload(workflow)}>
              Upload patient data
            </Button>
            <Button className="font-bold bg-brand-teal hover:bg-brand-teal/90 glow-teal-sm text-white px-5 py-2.5 rounded-lg transition-all" onClick={() => onStartUpload(workflow)}>
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
