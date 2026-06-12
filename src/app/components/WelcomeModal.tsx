import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { ArrowRight, Database, ShieldCheck, Banknote } from 'lucide-react';
import sanafinLogo from '../../assets/sanafin_logo.png';

interface WelcomePageProps {
  open: boolean;
  onStartUpload: () => void;
  onGoToUpload: () => void;
  onGoToDashboard: () => void;
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

export default function WelcomePage({ open, onStartUpload, onGoToUpload, onGoToDashboard }: WelcomePageProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          {/* Header */}
          <div className="bg-background px-16 flex-1 flex flex-row justify-center items-center gap-16 border-b border-border">
            <img src={sanafinLogo} alt="SanaFin" className="h-50 w-auto flex-shrink-0" />
            <div className="flex flex-col gap-4 max-w-2xl text-left">
              <p className="text-foreground leading-relaxed text-xl">
                SanaFin turns patient data into contract-ready evidence for outcome-based contracts.
                It automates verifying, and reporting results for payers and healthcare providers.
              </p>
              <p className="text-foreground leading-relaxed text-xl">
                The demo focuses on outcome verification and reporting for type 2 diabetes treatment, demonstrating how trusted
                evidence becomes the foundation for outcome-based contracts.
              </p>
            </div>
          </div>

          {/* Three-step diagram */}
          <div className="px-8 py-10 flex flex-col items-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              How it works
            </p>
            <div className="flex items-stretch gap-2 w-full max-w-2xl">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Fragment key={step.label}>
                    <div className={`flex-1 flex flex-col items-center gap-3 rounded-xl border ${step.borderColor} ${step.bg} p-6`}>
                      <div className={`size-14 rounded-full ${step.color} flex items-center justify-center`}>
                        <Icon className="size-7 text-white" />
                      </div>
                      <span className={`text-sm font-semibold ${step.textColor} text-center`}>{step.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex items-center">
                        <ArrowRight className="size-6 text-muted-foreground flex-shrink-0" />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 text-base text-muted-foreground w-full max-w-2xl">
              <div className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>Upload a CSV of patient data or use a sample dataset.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>SanaFin verifies each patient against your contract's clinical thresholds.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>A dashboard provides insights into the treatment performance of the cohort.</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 flex gap-3 pb-16 justify-center">
            <Button size="lg" onClick={onStartUpload}>
              Start with a sample upload
              <ArrowRight className="size-4 ml-2" />
            </Button>
            <Button size="lg" onClick={onGoToUpload}>
              Upload your own patient data
              <ArrowRight className="size-4 ml-2" />
            </Button>
            <Button size="lg" onClick={onGoToDashboard}>
              Go to Dashboard
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
