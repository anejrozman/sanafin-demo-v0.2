import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowRight, Database, ShieldCheck, Banknote } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onStartUpload: () => void;
  fullPage?: boolean;
}

const steps = [
  {
    icon: Database,
    label: 'Data Injection',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    bg: 'bg-blue-50',
  },
  {
    icon: ShieldCheck,
    label: 'Verification',
    color: 'bg-violet-600',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    bg: 'bg-violet-50',
  },
  {
    icon: Banknote,
    label: 'Payout',
    color: 'bg-emerald-600',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    bg: 'bg-emerald-50',
  },
];

export default function WelcomeModal({ open, onClose, onStartUpload, fullPage }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className={`p-0 gap-0 overflow-hidden ${fullPage ? 'max-w-none w-screen h-screen rounded-none flex flex-col' : 'max-w-lg'}`}>
        <DialogTitle className="sr-only">Welcome to SanaFin</DialogTitle>
        {/* Header */}
        <div className={`bg-gradient-to-br from-slate-900 to-slate-800 px-8 text-white ${fullPage ? 'flex-1 flex flex-col justify-center items-center text-center pt-0 pb-0' : 'pt-8 pb-6'}`}>
          <div className={`flex items-center gap-2 ${fullPage ? 'mb-6 justify-center' : 'mb-4'}`}>
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">S</span>
            </div>
            <span className="font-semibold tracking-tight">SanaFin</span>
          </div>
          <p className={`text-slate-100 leading-relaxed ${fullPage ? 'text-2xl max-w-md' : ''}`}>
            Get paid automatically when your patients' outcomes meet contract targets.
          </p>
        </div>

        {/* Three-step diagram */}
        <div className={`px-8 ${fullPage ? 'py-10 flex flex-col items-center' : 'py-6'}`}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            How it works
          </p>
          <div className={`flex items-center gap-1 ${fullPage ? 'w-full max-w-xl' : ''}`}>
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

          <div className={`mt-4 space-y-1.5 text-sm text-muted-foreground ${fullPage ? 'w-full max-w-xl' : ''}`}>
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
        <div className={`px-8 flex gap-3 ${fullPage ? 'pb-16 justify-center' : 'pb-8'}`}>
          <Button className="flex-1" onClick={onStartUpload}>
            Start with a sample upload
            <ArrowRight className="size-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useWelcomeModal() {
  const [open, setOpen] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('sanafin_welcome_seen');
    if (!seen) {
      setOpen(true);
      setIsFirstLoad(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem('sanafin_welcome_seen', '1');
    setOpen(false);
    setIsFirstLoad(false);
  };

  const reopen = () => {
    setIsFirstLoad(false);
    setOpen(true);
  };

  return { open, close, reopen, isFirstLoad };
}
