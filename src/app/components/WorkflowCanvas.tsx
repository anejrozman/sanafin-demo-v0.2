import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowRight, ArrowDown, Check, ScrollText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import WelcomePage from './WelcomeModal';
import DataUpload from './DataUpload';
import OutcomeTargets from './OutcomeTargets';
import Dashboard from './Dashboard';
import { useData } from '../../store/DataContext';
import { STEPS } from '../../lib/workflowSteps';
import { scrollToElement } from '../../lib/scroll';

// ── Mini workflow bar — shown at top of dashboard for reconfiguration ──────────

function MiniWorkflowBar({
  completedUpTo,
  onNodeClick,
}: {
  completedUpTo: number;
  onNodeClick: (i: number) => void;
}) {
  return (
    // sticky top-16 sits flush below AppHeader (h-16). overflow:clip on <main>
    // (not overflow:hidden) ensures sticky works relative to the viewport.
    <div data-mini-bar className="border-b border-foreground/5 bg-background/90 backdrop-blur sticky top-16 z-20 px-8 py-3">
      <div className="flex flex-col items-center gap-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
            Workflow Configuration
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            · Click any step to go back and reconfigure it
          </span>
        </div>
        {/* Step nodes */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {STEPS.map((step, i) => {
            const Icon = step.Icon;
            return (
              <Fragment key={step.id}>
                <button
                  onClick={() => onNodeClick(i)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-foreground/5 bg-background/60 hover:bg-background hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className={`size-6 rounded-full ${step.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon className="size-3" />
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-brand-teal transition-colors leading-tight">
                    {step.label}
                  </span>
                  {completedUpTo >= i && (
                    <Check className="size-3 text-emerald-500 flex-shrink-0" />
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="size-3 text-muted-foreground/40 flex-shrink-0" />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Animated connector between steps ─────────────────────────────────────────

function StepConnector() {
  return (
    <div className="flex flex-col items-center py-8 gap-3">
      {/* Fixed height so layout never shifts during animation */}
      <motion.div
        className="w-px h-14 bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      >
        <ChevronDown className="size-7 text-muted-foreground/50" />
      </motion.div>
    </div>
  );
}

// ── Dashboard transition arrow ────────────────────────────────────────────────

function DashboardTransitionArrow() {
  return (
    <div className="flex flex-col items-center py-16 gap-6">
      <motion.div
        className="w-0.5 bg-gradient-to-b from-emerald-600/30 to-emerald-600"
        initial={{ height: 0 }}
        animate={{ height: 120 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          <ArrowDown className="size-12 text-emerald-600" />
        </motion.div>
        <span className="text-sm font-semibold text-muted-foreground">Opening Dashboard…</span>
      </motion.div>
      <motion.div
        className="w-0.5 bg-gradient-to-b from-emerald-600 to-emerald-600/20"
        initial={{ height: 0 }}
        animate={{ height: 80 }}
        transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Single step node ──────────────────────────────────────────────────────────

interface StepNodeProps {
  step: typeof STEPS[0];
  isCompleted: boolean;
  summary: string;
  buttonLabel: string;
  onAction: () => void;
  nodeRef: (el: HTMLDivElement | null) => void;
}

function StepNode({ step, isCompleted, summary, buttonLabel, onAction, nodeRef }: StepNodeProps) {
  const { Icon } = step;
  return (
    <motion.div
      ref={nodeRef}
      id={step.id}
      // h-[calc(100vh-4rem)] = viewport minus header height — fits exactly in the available area
      // so one revealed node produces zero extra scroll space at the bottom
      className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center text-center gap-6 max-w-xl w-full">
        {/* Icon circle with completion badge */}
        <div className="relative">
          <div className={`size-40 rounded-full ${step.color} flex items-center justify-center text-white shadow-2xl`}>
            <Icon className="size-20" />
          </div>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute -bottom-2 -right-2 size-12 rounded-full bg-background border-2 border-foreground/10 flex items-center justify-center shadow-lg"
            >
              <Check className="size-6 text-emerald-500" />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-4xl font-black tracking-tight text-foreground leading-tight">
          {step.label}
        </h2>

        {/* Description — always visible */}
        <p className="text-lg text-muted-foreground font-medium leading-relaxed">
          {step.description}
        </p>

        {/* Completion summary — shown below description when step is done */}
        {isCompleted && summary && (
          <p className="text-sm text-emerald-500 font-semibold flex items-center gap-1.5">
            <Check className="size-4 flex-shrink-0" />
            {summary}
          </p>
        )}

        {/* Action button */}
        <Button
          size="lg"
          onClick={onAction}
          className={`${step.color} ${step.hoverColor} text-white px-12 py-5 text-base font-bold rounded-xl shadow-lg transition-all`}
        >
          {buttonLabel}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Payment modal — contract type selection + parameters ─────────────────────

interface ContractParam {
  id: string;
  label: string;
  type: 'number' | 'select';
  unit?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

interface ContractType {
  id: string;
  name: string;
  description: string;
  params: ContractParam[];
}

const EPISODE_MONTHS_PARAM: ContractParam = {
  id: 'episodeMonths',
  label: 'Program Length',
  type: 'number',
  unit: 'months',
  defaultValue: 6,
  min: 1,
  max: 36,
};

const CONTRACT_TYPES: ContractType[] = [
  {
    id: 'p4p',
    name: 'Pay-for-Performance (P4P)',
    description: 'A guaranteed base payment plus a bonus tied to outcome-target achievement. No cost risk — the provider earns more the better patients perform on clinical quality goals.',
    params: [
      EPISODE_MONTHS_PARAM,
      { id: 'totalPayoutPerPatient', label: 'Total Payout per Patient', type: 'number', unit: 'CHF', defaultValue: 5000, min: 0 },
      { id: 'bonusFraction', label: 'Bonus Fraction', type: 'number', unit: '(0–1)', defaultValue: 0.3, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'shared',
    name: 'Shared Savings / Shared Risk',
    description: 'The provider shares savings when cost falls below the per-patient benchmark AND the quality gate is met. Under two-sided mode the provider also absorbs a share of overages.',
    params: [
      EPISODE_MONTHS_PARAM,
      { id: 'savingsShare', label: 'Savings Share', type: 'number', unit: '(0–1)', defaultValue: 0.5, min: 0, max: 1, step: 0.05 },
      { id: 'twoSided', label: 'Two-Sided (Shared Risk)', type: 'select', options: ['No', 'Yes'] },
      { id: 'lossShare', label: 'Loss Share (if two-sided)', type: 'number', unit: '(0–1)', defaultValue: 0.5, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'bundled',
    name: 'Bundled Payments',
    description: 'A single fixed price covers the entire care episode. The provider keeps the surplus when cost is under the bundle and passes the quality+complications gate; overages are absorbed regardless.',
    params: [
      EPISODE_MONTHS_PARAM,
      { id: 'bundlePrice', label: 'Bundle Price per Episode', type: 'number', unit: 'CHF', defaultValue: 10000, min: 0 },
      { id: 'complicationCap', label: 'Complication Cap (gate)', type: 'number', unit: 'events', defaultValue: 1, min: 0, max: 10 },
    ],
  },
  {
    id: 'capitation',
    name: 'Capitation',
    description: 'A fixed per-member-per-month rate regardless of utilization. The provider keeps the full margin when costs are low and absorbs the full downside when costs are high — highest risk model.',
    params: [
      EPISODE_MONTHS_PARAM,
      { id: 'pmpm', label: 'Per-Member-Per-Month (PMPM)', type: 'number', unit: 'CHF', defaultValue: 500, min: 0 },
    ],
  },
];

function PaymentModal({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean;
  onConfirm: (type: string, params: Record<string, string | number>) => void;
  onClose: () => void;
}) {
  const { thresholds } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, string | number>>({});

  // Reset when modal opens
  useEffect(() => {
    if (open) { setSelectedId(null); setParams({}); }
  }, [open]);

  // Populate defaults when contract type changes
  useEffect(() => {
    if (!selectedId) return;
    const ct = CONTRACT_TYPES.find(c => c.id === selectedId);
    if (!ct) return;
    const defaults: Record<string, string | number> = {};
    ct.params.forEach(p => {
      defaults[p.id] = p.type === 'select' ? p.options![0] : (p.defaultValue ?? 0);
    });
    // P4P: equal weights per enabled rule
    if (selectedId === 'p4p') {
      const enabled = thresholds.rules.filter(r => r.enabled);
      const w = enabled.length > 0 ? 1 / enabled.length : 0;
      for (const rule of enabled) {
        defaults[`weight_${rule.id}`] = parseFloat(w.toFixed(4));
      }
    }
    setParams(defaults);
  }, [selectedId, thresholds]);

  const selected = CONTRACT_TYPES.find(c => c.id === selectedId) ?? null;
  const setParam = (id: string, val: string | number) =>
    setParams(prev => ({ ...prev, [id]: val }));

  const enabledRules = thresholds.rules.filter(r => r.enabled);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[84rem] sm:max-w-[84rem] max-h-[90vh] overflow-y-auto p-12 sm:rounded-xl">
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-brand-amber flex items-center justify-center text-white flex-shrink-0">
              <ScrollText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">Specify Payment Agreement</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold mt-0.5">
                Select a value-based contract model, then configure its parameters.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Contract type cards */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {CONTRACT_TYPES.map((ct, i) => (
            <button
              key={ct.id}
              onClick={() => setSelectedId(ct.id)}
              className={`text-left p-6 rounded-xl border transition-all ${
                selectedId === ct.id
                  ? 'border-brand-amber bg-brand-amber/8 shadow-sm'
                  : 'border-foreground/8 bg-background/60 hover:border-brand-amber/40 hover:bg-brand-amber/4'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`size-5 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${
                  selectedId === ct.id ? 'border-brand-amber bg-brand-amber' : 'border-muted-foreground/40'
                }`} />
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">{i + 1}.</p>
                  <p className="font-bold text-sm text-foreground leading-tight">{ct.name}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">{ct.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Parameters section — appears after a type is chosen */}
        {selected && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-foreground/5" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                Contract Parameters — {selected.name}
              </p>
              <div className="h-px flex-1 bg-foreground/5" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selected.params.map(param => (
                <div key={param.id} className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">{param.label}</label>
                  {param.type === 'select' ? (
                    <select
                      value={(params[param.id] as string) ?? param.options![0]}
                      onChange={e => setParam(param.id, e.target.value)}
                      className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-amber text-foreground"
                    >
                      {param.options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={(params[param.id] as number) ?? param.defaultValue}
                        onChange={e => setParam(param.id, parseFloat(e.target.value) || 0)}
                        step={param.step ?? 1}
                        min={param.min ?? 0}
                        max={param.max}
                        className="flex-1 rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-amber text-foreground"
                      />
                      <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">{param.unit}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* P4P: per-goal bonus weights */}
              {selectedId === 'p4p' && enabledRules.length > 0 && (
                <>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-px flex-1 bg-foreground/5" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                        Bonus Weights — per outcome goal (should sum to 1)
                      </p>
                      <div className="h-px flex-1 bg-foreground/5" />
                    </div>
                  </div>
                  {enabledRules.map(rule => (
                    <div key={rule.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">{rule.label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={(params[`weight_${rule.id}`] as number) ?? (1 / enabledRules.length)}
                          onChange={e => setParam(`weight_${rule.id}`, parseFloat(e.target.value) || 0)}
                          step={0.05}
                          min={0}
                          max={1}
                          className="flex-1 rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-amber text-foreground"
                        />
                        <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">(0–1)</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <Button
              size="lg"
              className="w-full bg-brand-amber hover:bg-brand-amber/90 text-white font-bold mt-2"
              onClick={() => onConfirm(selectedId!, params)}
            >
              Confirm contract configuration
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main WorkflowCanvas ───────────────────────────────────────────────────────

export default function WorkflowCanvas() {
  const {
    processed, setProcessed, setAnimationSeen, clearUploadedData,
    dataSource, patients,
    workflowView: view, setWorkflowView: setView,
    setWorkflowRevealedCount, setWorkflowCompletedUpTo,
    pendingWorkflowScroll, setPendingWorkflowScroll,
    setContractConfig,
  } = useData();

  // true while the arrow animation plays between workflow and dashboard
  const [transitioning, setTransitioning] = useState(false);

  // How many steps are fully configured (−1 = none)
  const [completedUpTo, setCompletedUpTo] = useState(-1);
  // How many step cards are currently rendered (increments progressively)
  const [revealedCount, setRevealedCount] = useState(1);

  // Per-step summaries shown beneath the description after completion
  const [workflowLabel, setWorkflowLabel] = useState('');
  const [objectivesLabel, setObjectivesLabel] = useState('');

  // Modal states
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Refs
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Snapshot of processed state when upload modal opens, to detect new completions
  const processedWhenUploadOpened = useRef(false);
  // Index to scroll to after switching back to workflow view
  const pendingScrollRef = useRef<number | null>(null);

  // ── Fix: Radix Dialog pointer-events leak ─────────────────────────────────
  // Radix sometimes leaves pointer-events:none on body after a Dialog closes.
  // Reset whenever all modals are closed so workflow nodes stay interactive.
  useEffect(() => {
    if (!welcomeOpen && !uploadOpen && !targetsOpen && !paymentOpen) {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.documentElement.style.pointerEvents = '';
      document.documentElement.style.overflow = '';
    }
  }, [welcomeOpen, uploadOpen, targetsOpen, paymentOpen]);

  // ── Progressive step reveal ───────────────────────────────────────────────
  useEffect(() => {
    const target = Math.min(completedUpTo + 2, STEPS.length);
    if (revealedCount < target) {
      const id = setTimeout(() => setRevealedCount(prev => Math.min(prev + 1, target)), 560);
      return () => clearTimeout(id);
    }
  }, [completedUpTo, revealedCount]);

  // Scroll to the newly revealed node — wait for animations to finish (connector fade: 400ms,
  // node slide-in: 600ms), then place the node flush below the sticky header.
  useEffect(() => {
    const target = Math.min(completedUpTo + 2, STEPS.length);
    if (revealedCount === target && revealedCount > 1) {
      const id = setTimeout(() => {
        const el = stepRefs.current[revealedCount - 1];
        if (!el) return;
        scrollToElement(el);
      }, 650);
      return () => clearTimeout(id);
    }
  }, [revealedCount, completedUpTo]);

  // Scroll to the pending node after returning from dashboard view
  useEffect(() => {
    if (view === 'workflow' && pendingScrollRef.current !== null) {
      const idx = pendingScrollRef.current;
      pendingScrollRef.current = null;
      setTimeout(() => {
        const el = stepRefs.current[idx];
        if (!el) return;
        scrollToElement(el);
      }, 150);
    }
  }, [view]);

  // ── Auto-close upload modal when processed transitions to true ────────────
  useEffect(() => {
    if (!processed) {
      processedWhenUploadOpened.current = false;
    }
  }, [processed]);

  useEffect(() => {
    if (uploadOpen && processed && !processedWhenUploadOpened.current) {
      const id = setTimeout(() => {
        setUploadOpen(false);
        setCompletedUpTo(1);
      }, 650);
      return () => clearTimeout(id);
    }
  }, [processed, uploadOpen]);

  // ── Sync local state to DataContext so AppSidebar can read it ───────────
  useEffect(() => { setWorkflowRevealedCount(revealedCount); }, [revealedCount, setWorkflowRevealedCount]);
  useEffect(() => { setWorkflowCompletedUpTo(completedUpTo); }, [completedUpTo, setWorkflowCompletedUpTo]);

  // ── Handle sidebar-triggered "view-only" scroll to a workflow node ────────
  useEffect(() => {
    if (view !== 'workflow' || pendingWorkflowScroll === null) return;
    setPendingWorkflowScroll(null);
    const idx = pendingWorkflowScroll;
    setTimeout(() => {
      const el = stepRefs.current[idx];
      if (!el) return;
      scrollToElement(el);
    }, 150);
  }, [view, pendingWorkflowScroll, setPendingWorkflowScroll]);

  // ── Go to dashboard (called from node 4) ─────────────────────────────────
  // Shows a 2-second animated arrow, then switches view and scrolls to top.
  const goToDashboard = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setAnimationSeen(true);
      setCompletedUpTo(4);
      setView('dashboard');
      setTransitioning(false);
      window.scrollTo({ top: 0 });
    }, 2000);
  }, [setAnimationSeen]);

  // ── Return from dashboard to a specific workflow node ─────────────────────
  const goBackToNode = useCallback((stepIndex: number) => {
    // Node 4 IS the dashboard — clicking it just scrolls to top
    if (stepIndex === 4) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setAnimationSeen(false);

    if (stepIndex === 0) {
      setCompletedUpTo(-1);
      setRevealedCount(1);
      setWorkflowLabel('');
      setObjectivesLabel('');
    } else {
      setRevealedCount(stepIndex + 1);
      setCompletedUpTo(stepIndex - 1);
    }

    pendingScrollRef.current = stepIndex;
    setView('workflow');

    if (stepIndex === 0) {
      setWelcomeOpen(true);
    } else if (stepIndex === 1) {
      processedWhenUploadOpened.current = processed;
      setUploadOpen(true);
    } else if (stepIndex === 2) {
      setTargetsOpen(true);
    } else if (stepIndex === 3) {
      setPaymentOpen(true);
    }
  }, [processed, setAnimationSeen]);

  // ── Welcome modal callbacks ───────────────────────────────────────────────
  const handleStartSample = useCallback((workflow: string) => {
    setWelcomeOpen(false);
    setWorkflowLabel(workflow === 'metabolic' ? 'Metabolic Health Demo' : workflow);
    if (dataSource === 'uploaded') clearUploadedData();
    setProcessed(true);
    processedWhenUploadOpened.current = true; // prevent spurious auto-close trigger
    setCompletedUpTo(1);
  }, [dataSource, clearUploadedData, setProcessed]);

  const handleGoToUpload = useCallback((workflow: string) => {
    setWelcomeOpen(false);
    setWorkflowLabel(workflow === 'metabolic' ? 'Metabolic Health Demo' : workflow);
    setCompletedUpTo(0);
  }, []);

  // ── Node click handler ────────────────────────────────────────────────────
  const handleNodeClick = useCallback((stepIndex: number) => {
    setRevealedCount(stepIndex + 1);
    setCompletedUpTo(stepIndex - 1);

    if (stepIndex === 0) {
      setCompletedUpTo(-1);
      setRevealedCount(1);
      setWorkflowLabel('');
      setObjectivesLabel('');
      setWelcomeOpen(true);
    } else if (stepIndex === 1) {
      processedWhenUploadOpened.current = processed;
      setUploadOpen(true);
    } else if (stepIndex === 2) {
      setTargetsOpen(true);
    } else if (stepIndex === 3) {
      setPaymentOpen(true);
    } else if (stepIndex === 4) {
      goToDashboard();
    }
  }, [processed, goToDashboard]);

  // ── Modal close/complete handlers ─────────────────────────────────────────
  const handleUploadClose = useCallback(() => {
    setUploadOpen(false);
    if (processed) setCompletedUpTo(1);
  }, [processed]);

  // Closing targets with X just dismisses — only "Set outcome targets" button advances.
  const handleTargetsConfirm = useCallback(() => {
    setTargetsOpen(false);
    setObjectivesLabel('Treatment objectives configured');
    setCompletedUpTo(2);
  }, []);

  const handlePaymentConfirm = useCallback((type: string, params: Record<string, string | number>) => {
    setContractConfig(type, params);
    setPaymentOpen(false);
    setCompletedUpTo(3);
  }, [setContractConfig]);

  // ── Summaries & button labels ─────────────────────────────────────────────
  const isCompleted = (i: number) => completedUpTo >= i;

  const summaries = [
    workflowLabel || 'Workflow selected',
    processed ? `${patients.length} patient records loaded` : 'Sample data loaded',
    objectivesLabel || 'Treatment objectives configured',
    'Payment agreement specified',
    '',
  ];

  const buttonLabel = (i: number): string => {
    if (i === 0) return isCompleted(0) ? 'Change Workflow' : 'Select Workflow';
    if (i === 4) return 'Open Dashboard';
    return isCompleted(i) ? 'Reconfigure' : 'Get Started';
  };

  return (
    <div className="relative">

      {/* ── Workflow view: node-by-node interactive flow ── */}
      {view === 'workflow' && (
        <div className="bg-muted/15 bg-dot-grid">
          <div>
            <AnimatePresence>
              {Array.from({ length: revealedCount }).map((_, i) => (
                <div key={STEPS[i].id}>
                  {i > 0 && <StepConnector />}
                  <StepNode
                    step={STEPS[i]}
                    isCompleted={isCompleted(i)}
                    summary={summaries[i]}
                    buttonLabel={buttonLabel(i)}
                    onAction={() => handleNodeClick(i)}
                    nodeRef={el => { stepRefs.current[i] = el; }}
                  />
                </div>
              ))}
            </AnimatePresence>

            {/* Arrow animation that plays before switching to dashboard */}
            {transitioning && <DashboardTransitionArrow />}
          </div>
        </div>
      )}

      {/* ── Dashboard view: outcome reporting + mini reconfigure bar ── */}
      {view === 'dashboard' && (
        <>
          {/* Sticky bar sits at top-16 so it stacks below AppHeader (top-0 z-40).
              Kept outside the motion.div so CSS transforms from the fade-in animation
              don't break position:sticky (transforms create a new stacking context). */}
          <MiniWorkflowBar completedUpTo={completedUpTo} onNodeClick={goBackToNode} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto p-8">
              <Dashboard />
            </div>
          </motion.div>
        </>
      )}

      {/* ── Modals (rendered regardless of active view) ── */}
      <WelcomePage
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        onStartUpload={handleStartSample}
        onGoToUpload={handleGoToUpload}
      />

      {/* Upload — 2× bigger than the original max-w-2xl */}
      <Dialog
        open={uploadOpen}
        onOpenChange={open => { if (!open) handleUploadClose(); }}
      >
        <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-xl overflow-hidden">
          <DataUpload />
        </DialogContent>
      </Dialog>

      {/* Configure objectives — 1.5× bigger; closing with X does NOT advance */}
      <Dialog
        open={targetsOpen}
        onOpenChange={open => { if (!open) setTargetsOpen(false); }}
      >
        <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[85vh] overflow-y-auto p-6 sm:rounded-xl">
          <OutcomeTargets onConfirm={handleTargetsConfirm} />
        </DialogContent>
      </Dialog>

      {/* Payment agreement — closeable with X, only confirm button advances */}
      <PaymentModal
        open={paymentOpen}
        onConfirm={handlePaymentConfirm}
        onClose={() => setPaymentOpen(false)}
      />
    </div>
  );
}
