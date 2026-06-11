import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Database, ShieldCheck, FileText, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
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
}

// ─── Connector SVG ─────────────────────────────────────────────────────────────
function Connector({ active, animated }: { active: boolean; animated: boolean }) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    if (animated) {
      pathRef.current.style.strokeDasharray = `${len}`;
      pathRef.current.style.strokeDashoffset = `${len}`;
      pathRef.current.style.transition = 'stroke-dashoffset 0.8s ease-in-out';
      requestAnimationFrame(() => {
        if (pathRef.current) pathRef.current.style.strokeDashoffset = '0';
      });
    } else {
      pathRef.current.style.strokeDasharray = 'none';
      pathRef.current.style.strokeDashoffset = '0';
      pathRef.current.style.transition = 'none';
    }
  }, [animated]);

  return (
    <div className="flex items-center" style={{ width: 64, flexShrink: 0 }}>
      <svg width="64" height="40" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          ref={pathRef}
          d="M 0 20 C 20 20, 44 20, 64 20"
          stroke={active ? '#55B4A6' : '#e8e0d8'}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <polygon points="58,15 64,20 58,25" fill={active ? '#55B4A6' : '#e8e0d8'} />
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
  return (
    <motion.button
      onClick={onClick}
      disabled={status === 'pending'}
      className={`
        relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6
        w-52 text-left transition-all
        ${status === 'pending' ? 'border-border bg-background opacity-50 cursor-not-allowed' : ''}
        ${status === 'running' ? 'border-brand-teal/40 bg-brand-teal/10 shadow-md' : ''}
        ${status === 'done' ? `${color.ring} bg-background shadow-sm hover:shadow-md cursor-pointer` : ''}
      `}
      whileHover={status === 'done' ? { scale: 1.02 } : {}}
      whileTap={status === 'done' ? { scale: 0.98 } : {}}
    >
      <div className="absolute top-3 right-3">
        {status === 'running' && <Loader2 className="size-4 text-brand-teal animate-spin" />}
        {status === 'done' && <CheckCircle className="size-4 text-emerald-500" />}
      </div>

      <div className={`size-12 rounded-xl ${status === 'done' ? color.bg : 'bg-muted'} flex items-center justify-center`}>
        <Icon className={`size-6 ${status === 'done' ? color.icon : 'text-muted-foreground'}`} />
      </div>

      <div>
        <p className={`font-semibold text-sm ${status === 'done' ? color.text : 'text-muted-foreground'}`}>{label}</p>
      </div>

      {status === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground text-center space-y-0.5"
        >
          {summary}
        </motion.div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <span>Details</span>
          <ChevronRight className="size-3" />
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
export default function WorkflowView({ filename, patients, thresholds, onComplete, initiallyComplete = false }: WorkflowViewProps) {
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
  const enabledRules = thresholds.rules.filter(r => r.enabled);

  useEffect(() => {
    if (initiallyComplete) {
      onComplete?.();
      return;
    }
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
  }, []);

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
      color: { ring: 'border-blue-200', bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
      summary: (
        <>
          <p className="font-semibold text-foreground">CSV</p>
          <p>{patients.length} patients ingested</p>
        </>
      ),
    },
    {
      id: 'verification',
      icon: ShieldCheck,
      label: 'Verification',
      color: { ring: 'border-violet-200', bg: 'bg-violet-50', icon: 'text-violet-600', text: 'text-violet-700' },
      summary: (
        <>
          <p>
            <span className="text-brand-teal font-semibold">{cats.pass.length + cats.onTrack.length}</span>
            {' meeting · '}
            <span className="text-brand-amber font-semibold">{cats.fail.length + cats.flagged.length}</span>
            {' not'}
          </p>
          <p>{enabledRules.length} rule{enabledRules.length !== 1 ? 's' : ''}</p>
        </>
      ),
    },
    {
      id: 'reporting',
      icon: FileText,
      label: 'Reporting',
      color: { ring: 'border-emerald-200', bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
      summary: (
        <>
          <p>
            <span className="text-brand-teal font-semibold">{cats.pass.length} pass</span>
            {' · '}
            <span className="text-brand-amber font-semibold">{cats.fail.length} fail</span>
          </p>
          <p>
            <span className="text-brand-teal font-semibold">{cats.onTrack.length} on track</span>
            {' · '}
            <span className="text-brand-amber font-semibold">{cats.flagged.length} flagged</span>
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="mt-8">
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Processing pipeline</p>
        <p className="text-sm text-muted-foreground mt-0.5">Click any node to inspect details</p>
      </div>

      <div className="flex items-center justify-center py-10 px-6 rounded-2xl border bg-muted gap-0">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center">
            <WorkflowNode
              {...node}
              status={nodeStatuses[node.id]}
              onClick={() => nodeStatuses[node.id] === 'done' && setDrawerOpen(node.id)}
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
