import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowRight, Database, ShieldCheck, Banknote } from 'lucide-react';
import sanafinLogo from '../../assets/sanafin_logo.png';

interface WelcomePageProps {
  open: boolean;
  onClose: () => void;
  onStartUpload: () => void;
}

const steps = [
  {
    icon: Database,
    label: 'Data Injection',
    color: 'bg-brand-teal',
    textColor: 'text-brand-teal',
    borderColor: 'border-brand-teal/30',
    bg: 'bg-brand-teal/10',
  },
  {
    icon: ShieldCheck,
    label: 'Verification',
    color: 'bg-brand-amber',
    textColor: 'text-brand-amber',
    borderColor: 'border-brand-amber/30',
    bg: 'bg-brand-amber/10',
  },
  {
    icon: Banknote,
    label: 'Payout',
    color: 'bg-brand-teal',
    textColor: 'text-brand-teal',
    borderColor: 'border-brand-teal/30',
    bg: 'bg-brand-teal/10',
  },
];

export default function WelcomePage({ open, onClose, onStartUpload }: WelcomePageProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="bg-background px-8 flex-1 flex flex-col justify-center items-center text-center border-b border-border">
        <img src={sanafinLogo} alt="SanaFin" className="h-30 w-auto mb-6" />
        <p className="text-foreground leading-relaxed text-2xl max-w-md">
          Get paid automatically when your patients' outcomes meet contract targets.
        </p>
      </div>

      {/* Three-step diagram */}
      <div className="px-8 py-10 flex flex-col items-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          How it works
        </p>
        <div className="flex items-center gap-1 w-full max-w-xl">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-1 flex-1">
                <div className={`flex-1 flex flex-col items-center gap-2 rounded-xl border ${step.borderColor} ${step.bg} p-4`}>
                  <div className={`size-10 rounded-full ${step.color} flex items-center justify-center`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <span className={`text-xs font-semibold ${step.textColor} text-center`}>{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-1.5 text-sm text-muted-foreground w-full max-w-xl">
          <div className="flex gap-2">
            <span className="font-medium text-foreground">1.</span>
            <span>Upload a CSV of patient outcomes — one row per patient.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-foreground">2.</span>
            <span>SanaFin verifies each patient against your contract's clinical thresholds.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-foreground">3.</span>
            <span>Funds are released from escrow to your clinic account automatically.</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 flex gap-3 pb-16 justify-center">
        <Button className="flex-1 max-w-xs" onClick={onStartUpload}>
          Start with a sample upload
          <ArrowRight className="size-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={onClose}>
          Dismiss
        </Button>
      </div>
    </div>
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
