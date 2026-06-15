import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Database, ShieldCheck, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { type PatientRecord, PATIENT_CSV_COLUMNS } from '../../lib/schema';
import { type Thresholds } from '../../lib/thresholds';
import {
  getAsOfDate,
  classifyCohort,
  getByCategory,
  getFlaggedSorted,
  type ClassifiedPatient,
  type PatientCategory,
} from '../../lib/selectors';

type NodeStatus = 'pending' | 'running' | 'done';
type NodeId = 'injection' | 'verification' | 'reporting';

interface WorkflowViewProps {
  filename: string;
  patients: PatientRecord[];
  thresholds: Thresholds;
  onComplete?: () => void;
  initiallyComplete?: boolean;
  onNodeClick?: (nodeId: NodeId) => void;
  processed?: boolean;
}

// ─── Connector SVG ─────────────────────────────────────────────────────────────
function Connector({ active, animated }: { active: boolean; animated: boolean }) {
  return (
    <div className="flex items-center" style={{ width: 50, flexShrink: 0 }}>
      <svg width="50" height="40" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
        {/* Background track path */}
        <path
          d="M 0 20 L 50 20"
          stroke={active ? "rgba(85, 180, 166, 0.15)" : "rgba(0, 0, 0, 0.05)"}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Flow light path overlay */}
        <path
          d="M 0 20 L 50 20"
          stroke={active ? '#55B4A6' : 'transparent'}
          strokeWidth="2"
          strokeLinecap="round"
          className={active && animated ? "connector-dash-flow glow-teal-sm" : ""}
          fill="none"
        />
        {/* Endpoint arrow head */}
        <path
          d="M 43 15 L 50 20 L 43 25"
          stroke={active ? '#55B4A6' : 'rgba(0, 0, 0, 0.15)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// ─── Single workflow node ──────────────────────────────────────────────────────
function WorkflowNode({
  id,
  icon: Icon,
  label,
  status,
  summary,
  color,
  onClick,
}: {
  id: NodeId;
  icon: React.ElementType;
  label: string;
  status: NodeStatus;
  summary: React.ReactNode;
  color: { ring: string; bg: string; icon: string; text: string };
  onClick: () => void;
}) {
  const isRunning = status === 'running';
  const isDone = status === 'done';
  const isPending = status === 'pending';

  const pulseClass = 
    id === 'injection' ? 'pulse-ring-teal-active' :
    id === 'verification' ? 'pulse-ring-violet-active' :
    'pulse-ring-emerald-active';

  return (
    <motion.button
      onClick={onClick}
      disabled={isPending}
      className={`
        relative flex flex-col items-start gap-2 rounded-xl border p-3
        w-[13rem] text-left transition-all duration-300 backdrop-blur-md
        ${isPending ? 'border-border/30 bg-background/15 opacity-35 cursor-not-allowed' : ''}
        ${isRunning ? `border-brand-teal/40 bg-brand-teal/5 shadow-xs ${pulseClass}` : ''}
        ${isDone ? `glass-panel hover-glass-card cursor-pointer border-foreground/5 ${color.ring}` : ''}
      `}
      whileHover={isDone ? { scale: 1.01 } : {}}
      whileTap={isDone ? { scale: 0.99 } : {}}
    >
      <div className="flex items-center gap-2.5 w-full">
        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
          isDone ? color.bg : isRunning ? 'bg-brand-teal/10' : 'bg-muted'
        }`}>
          <Icon className={`size-4.5 transition-transform ${
            isDone ? color.icon : isRunning ? 'text-brand-teal' : 'text-muted-foreground'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-xs tracking-tight transition-colors ${
            isDone ? 'text-foreground' : isRunning ? 'text-brand-teal' : 'text-muted-foreground'
          }`}>{label}</p>
        </div>
        <div className="shrink-0 flex items-center justify-center">
          {isRunning && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal"></span>
            </span>
          )}
          {isDone && <CheckCircle className="size-4 text-brand-teal glow-teal-sm" />}
        </div>
      </div>

      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-muted-foreground leading-normal w-full space-y-0.5 pt-1.5 border-t border-foreground/5 font-medium pl-0.5"
        >
          {summary}
        </motion.div>
      )}

      {isDone && (
        <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground/60 font-bold pl-0.5 hover:text-brand-teal transition-colors">
          <span>{
            id === 'injection' ? 'New Ingestion' :
            id === 'verification' ? 'Define Logic' :
            'Breakdown'
          }</span>
          <ChevronRight className="size-2.5" />
        </div>
      )}
    </motion.button>
  );
}


// ─── Category badge ─────────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: PatientCategory }) {
  if (category === 'pass')
    return <Badge className="bg-brand-teal text-white text-xs">Pass</Badge>;
  if (category === 'fail')
    return <Badge className="bg-brand-amber text-white text-xs">Fail</Badge>;
  if (category === 'on_track')
    return <Badge variant="outline" className="border-brand-teal text-brand-teal text-xs">On track</Badge>;
  return <Badge variant="outline" className="border-brand-amber text-brand-amber text-xs">Flagged</Badge>;
}

// ─── Drawer panels ─────────────────────────────────────────────────────────────
function InjectionDrawer({ filename, patients }: { filename: string; patients: PatientRecord[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Source</p>
          <p className="font-medium mt-0.5 break-all">{filename}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Format</p>
          <p className="font-medium mt-0.5">CSV</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Patients ingested</p>
          <p className="font-medium mt-0.5">{patients.length}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge className="bg-emerald-600 text-white mt-0.5">Complete</Badge>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Patient records — {patients.length} rows
        </p>
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-auto max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted sticky top-0">
                  {PATIENT_CSV_COLUMNS.map(col => (
                    <TableHead key={col.name} className="text-xs font-mono whitespace-nowrap px-3">
                      {col.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map(p => (
                  <TableRow key={p.patient_id}>
                    {PATIENT_CSV_COLUMNS.map(col => (
                      <TableCell key={col.name} className="text-xs font-mono whitespace-nowrap px-3">
                        {String(p[col.name])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationDrawer({
  classified,
  thresholds,
}: {
  classified: ClassifiedPatient[];
  thresholds: Thresholds;
}) {
  const enabledRules = thresholds.rules.filter(r => r.enabled);
  const policyLabel =
    thresholds.passPolicy === 'all'
      ? `All ${enabledRules.length} rules must pass`
      : thresholds.passPolicy === 'any'
      ? 'At least 1 rule must pass'
      : `At least ${thresholds.minRulesToPass ?? 1} rules must pass`;

  const passCount   = classified.filter(c => c.category === 'pass').length;
  const failCount   = classified.filter(c => c.category === 'fail').length;
  const onTrackCount = classified.filter(c => c.category === 'on_track').length;
  const flaggedCount = classified.filter(c => c.category === 'flagged').length;

  return (
    <div className="space-y-4">
      {/* Contract rules */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm">
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">Contract rules</p>
        <div className="space-y-1.5">
          {enabledRules.map(rule => (
            <code key={rule.id} className="text-xs block bg-background border border-violet-100 rounded p-2">
              IF {rule.label} {rule.operator} {rule.value} {rule.unit}
            </code>
          ))}
          <p className="text-xs text-violet-700 pt-1">Pass policy: {policyLabel}</p>
        </div>
      </div>

      {/* 4-category summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg p-3 text-center bg-brand-teal/10 border border-brand-teal/30">
          <p className="text-2xl font-bold text-brand-teal">{passCount}</p>
          <p className="text-xs font-medium text-brand-teal mt-0.5">Pass</p>
          <p className="text-xs text-muted-foreground">completed</p>
        </div>
        <div className="rounded-lg p-3 text-center bg-brand-amber/10 border border-brand-amber/30">
          <p className="text-2xl font-bold text-brand-amber">{failCount}</p>
          <p className="text-xs font-medium text-brand-amber mt-0.5">Fail</p>
          <p className="text-xs text-muted-foreground">completed</p>
        </div>
        <div className="rounded-lg p-3 text-center border border-brand-teal/40">
          <p className="text-2xl font-bold text-brand-teal">{onTrackCount}</p>
          <p className="text-xs font-medium text-brand-teal mt-0.5">On track</p>
          <p className="text-xs text-muted-foreground">active</p>
        </div>
        <div className="rounded-lg p-3 text-center border border-brand-amber/40">
          <p className="text-2xl font-bold text-brand-amber">{flaggedCount}</p>
          <p className="text-xs font-medium text-brand-amber mt-0.5">Flagged</p>
          <p className="text-xs text-muted-foreground">active</p>
        </div>
      </div>

      {/* Per-patient list */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Per-patient results — {classified.length} rows
        </p>
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-auto max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted sticky top-0">
                  <TableHead className="text-xs">Patient</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">HbA1c Δ</TableHead>
                  <TableHead className="text-xs">CGM TiR</TableHead>
                  <TableHead className="text-xs">Wt loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classified.map(c => {
                  const hba1c = c.evaluation.metrics.hba1c_change;
                  const cgm   = c.evaluation.metrics.cgm_time_in_range;
                  const wt    = c.evaluation.metrics.weight_loss_pct;
                  return (
                    <TableRow key={c.patient.patient_id}>
                      <TableCell className="font-mono text-xs">{c.patient.patient_id}</TableCell>
                      <TableCell><CategoryBadge category={c.category} /></TableCell>
                      <TableCell className="text-xs">
                        {hba1c != null ? (
                          <span className={hba1c >= 0.5 ? 'text-brand-teal font-medium' : 'text-brand-amber font-medium'}>
                            {hba1c >= 0 ? `−${hba1c.toFixed(1)}` : `+${Math.abs(hba1c).toFixed(1)}`} pp
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {cgm != null ? (
                          <span className={cgm >= 70 ? 'text-brand-teal font-medium' : 'text-brand-amber font-medium'}>
                            {cgm}%
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {wt != null ? (
                          <span className={wt >= 5 ? 'text-brand-teal font-medium' : 'text-brand-amber font-medium'}>
                            {wt.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportingDrawer({ classified }: { classified: ClassifiedPatient[] }) {
  const cats = getByCategory(classified);
  const flaggedSorted = getFlaggedSorted(classified);

  function MetricTable({
    title,
    titleColor,
    rows,
    showDaysRemaining,
    showUnmet,
    emptyMsg,
  }: {
    title: string;
    titleColor: string;
    rows: ClassifiedPatient[];
    showDaysRemaining: boolean;
    showUnmet: boolean;
    emptyMsg: string;
  }) {
    return (
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${titleColor}`}>
          {title} — {rows.length} patient{rows.length !== 1 ? 's' : ''}
        </p>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 pl-1">{emptyMsg}</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto max-h-[280px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted sticky top-0">
                    <TableHead className="text-xs">Patient</TableHead>
                    <TableHead className="text-xs">HbA1c Δ</TableHead>
                    <TableHead className="text-xs">CGM TiR</TableHead>
                    <TableHead className="text-xs">Wt loss</TableHead>
                    {showDaysRemaining && <TableHead className="text-xs">Days left</TableHead>}
                    {showUnmet && <TableHead className="text-xs">Unmet targets</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(c => {
                    const hba1c = c.evaluation.metrics.hba1c_change;
                    const cgm   = c.evaluation.metrics.cgm_time_in_range;
                    const wt    = c.evaluation.metrics.weight_loss_pct;
                    return (
                      <TableRow key={c.patient.patient_id}>
                        <TableCell className="font-mono text-xs">{c.patient.patient_id}</TableCell>
                        <TableCell className="text-xs">
                          {hba1c != null ? `${hba1c >= 0 ? '−' : '+'}${Math.abs(hba1c).toFixed(1)} pp` : '—'}
                        </TableCell>
                        <TableCell className="text-xs">{cgm != null ? `${cgm}%` : '—'}</TableCell>
                        <TableCell className="text-xs">{wt != null ? `${wt.toFixed(1)}%` : '—'}</TableCell>
                        {showDaysRemaining && (
                          <TableCell className="text-xs tabular-nums">{c.daysRemaining ?? '—'}</TableCell>
                        )}
                        {showUnmet && (
                          <TableCell className="text-xs">
                            <div className="flex flex-wrap gap-1">
                              {(c.targetGaps.length > 0 ? c.targetGaps : c.unmetTargetLabels.map(l => ({ label: l, gap: null, unit: '' }))).map((g) => (
                                <span
                                  key={g.label}
                                  className="text-xs border border-brand-amber text-brand-amber rounded-full px-1.5 py-0 whitespace-nowrap"
                                >
                                  {'gap' in g && g.gap !== null
                                    ? `${g.label} Δ${(g.gap as number).toFixed(1)}${g.unit}`
                                    : g.label}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MetricTable
        title="Passed — completed treatment"
        titleColor="text-brand-teal"
        rows={cats.pass}
        showDaysRemaining={false}
        showUnmet={false}
        emptyMsg="No patients completed treatment with passing outcomes."
      />
      <MetricTable
        title="Failed — completed treatment"
        titleColor="text-brand-amber"
        rows={cats.fail}
        showDaysRemaining={false}
        showUnmet={true}
        emptyMsg="No patients completed treatment without meeting targets."
      />
      <MetricTable
        title="On track — in treatment, currently meeting targets"
        titleColor="text-brand-teal"
        rows={cats.onTrack}
        showDaysRemaining={true}
        showUnmet={false}
        emptyMsg="No active patients currently meeting all targets."
      />
      <MetricTable
        title="Flagged — in treatment, not yet meeting targets"
        titleColor="text-brand-amber"
        rows={flaggedSorted}
        showDaysRemaining={true}
        showUnmet={true}
        emptyMsg="No active patients with unmet targets."
      />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function WorkflowView({
  filename,
  patients,
  thresholds,
  onComplete,
  initiallyComplete = false,
  onNodeClick,
  processed = false,
}: WorkflowViewProps) {
  const [nodeStatuses, setNodeStatuses] = useState<Record<NodeId, NodeStatus>>(() =>
    initiallyComplete
      ? { injection: 'done', verification: 'done', reporting: 'done' }
      : { injection: 'pending', verification: 'pending', reporting: 'pending' },
  );
  const [connectorActive, setConnectorActive] = useState(() =>
    initiallyComplete ? { c1: true, c2: true } : { c1: false, c2: false },
  );
  const [connectorAnimated, setConnectorAnimated] = useState({ c1: false, c2: false });
  const [drawerOpen, setDrawerOpen] = useState<NodeId | null>(null);

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const classified = useMemo(() => classifyCohort(patients, thresholds, asOf), [patients, thresholds, asOf]);
  const cats = useMemo(() => getByCategory(classified), [classified]);

  useEffect(() => {
    // If not processed, reset to pending
    if (!processed && !initiallyComplete) {
      setNodeStatuses({ injection: 'pending', verification: 'pending', reporting: 'pending' });
      setConnectorActive({ c1: false, c2: false });
      setConnectorAnimated({ c1: false, c2: false });
      return;
    }

    // If processed and already complete (or animationSeen), set all done
    if (processed && initiallyComplete) {
      setNodeStatuses({ injection: 'done', verification: 'done', reporting: 'done' });
      setConnectorActive({ c1: true, c2: true });
      return;
    }

    // If processed is true and not complete, run animation
    if (processed && !initiallyComplete) {
      const t1 = setTimeout(() => setNodeStatuses(s => ({ ...s, injection: 'running' })), 100);
      const t2 = setTimeout(() => setNodeStatuses(s => ({ ...s, injection: 'done' })), 1400);
      const t3 = setTimeout(() => {
        setConnectorActive(s => ({ ...s, c1: true }));
        setConnectorAnimated(s => ({ ...s, c1: true }));
      }, 1600);
      const t4 = setTimeout(() => setNodeStatuses(s => ({ ...s, verification: 'running' })), 1800);
      const t5 = setTimeout(() => setNodeStatuses(s => ({ ...s, verification: 'done' })), 3100);
      const t6 = setTimeout(() => {
        setConnectorActive(s => ({ ...s, c2: true }));
        setConnectorAnimated(s => ({ ...s, c2: true }));
      }, 3300);
      const t7 = setTimeout(() => setNodeStatuses(s => ({ ...s, reporting: 'running' })), 3500);
      const t8 = setTimeout(() => {
        setNodeStatuses(s => ({ ...s, reporting: 'done' }));
        onComplete?.();
      }, 4800);
      return () => [t1, t2, t3, t4, t5, t6, t7, t8].forEach(clearTimeout);
    }
  }, [processed, initiallyComplete, onComplete]);

  const nodes: {
    id: NodeId;
    icon: React.ElementType;
    label: string;
    color: { ring: string; bg: string; icon: string; text: string };
    summary: React.ReactNode;
  }[] = [
    {
      id: 'injection',
      icon: Database,
      label: 'Data Injection',
      color: { ring: 'border-blue-500/20 shadow-blue-500/5', bg: 'bg-blue-500/10', icon: 'text-blue-500', text: 'text-blue-500' },
      summary: (
        <div className="text-[10px] text-muted-foreground font-semibold">
          <span>CSV · {patients.length} patients</span>
        </div>
      ),
    },
    {
      id: 'verification',
      icon: ShieldCheck,
      label: 'Verification',
      color: { ring: 'border-violet-500/20 shadow-violet-500/5', bg: 'bg-violet-500/10', icon: 'text-violet-500', text: 'text-violet-500' },
      summary: (
        <div className="space-y-0.5 text-[10px] text-muted-foreground font-semibold leading-tight">
          <p>
            <span className="text-brand-teal font-bold">{cats.pass.length} Pass</span> ·{' '}
            <span className="text-brand-amber font-bold">{cats.fail.length} Fail</span>
          </p>
          <p>
            <span className="text-brand-teal font-bold">{cats.onTrack.length} Track</span> ·{' '}
            <span className="text-brand-amber font-bold">{cats.flagged.length} Flag</span>
          </p>
        </div>
      ),
    },
    {
      id: 'reporting',
      icon: FileText,
      label: 'Reporting',
      color: { ring: 'border-emerald-500/20 shadow-emerald-500/5', bg: 'bg-emerald-500/10', icon: 'text-emerald-500', text: 'text-emerald-500' },
      summary: (
        <div className="text-[10px] text-muted-foreground font-semibold leading-tight">
          <p>Reports generated</p>
          <p className="text-[9px] text-brand-teal font-bold mt-0.5">Ready to audit</p>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-0">
      <div className="flex items-center justify-center py-4 px-4 rounded-xl border bg-muted/20 backdrop-blur-md bg-dot-grid border-foreground/5 gap-0 shadow-xs">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center">
            <WorkflowNode
              {...node}
              status={nodeStatuses[node.id]}
              onClick={() => {
                if (nodeStatuses[node.id] === 'done') {
                  if (onNodeClick) {
                    onNodeClick(node.id);
                  } else {
                    setDrawerOpen(node.id);
                  }
                }
              }}
            />
            {i < nodes.length - 1 && (
              <Connector
                active={connectorActive[i === 0 ? 'c1' : 'c2']}
                animated={connectorAnimated[i === 0 ? 'c1' : 'c2']}
              />
            )}
          </div>
        ))}
      </div>


      <Sheet open={drawerOpen === 'injection'} onOpenChange={v => !v && setDrawerOpen(null)}>
        <SheetContent className="w-[780px] sm:max-w-[780px] overflow-y-auto px-8 py-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Database className="size-5 text-blue-600" />
              Data Injection
            </SheetTitle>
            <SheetDescription>Ingested records and detected schema</SheetDescription>
          </SheetHeader>
          <InjectionDrawer filename={filename} patients={patients} />
        </SheetContent>
      </Sheet>

      <Sheet open={drawerOpen === 'verification'} onOpenChange={v => !v && setDrawerOpen(null)}>
        <SheetContent className="w-[780px] sm:max-w-[780px] overflow-y-auto px-8 py-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-violet-600" />
              Verification
            </SheetTitle>
            <SheetDescription>Clinical rule gates and per-patient verdicts</SheetDescription>
          </SheetHeader>
          <VerificationDrawer classified={classified} thresholds={thresholds} />
        </SheetContent>
      </Sheet>

      <Sheet open={drawerOpen === 'reporting'} onOpenChange={v => !v && setDrawerOpen(null)}>
        <SheetContent className="w-[780px] sm:max-w-[780px] overflow-y-auto px-8 py-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="size-5 text-emerald-600" />
              Reporting
            </SheetTitle>
            <SheetDescription>Outcome evidence across all four patient categories</SheetDescription>
          </SheetHeader>
          <ReportingDrawer classified={classified} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
