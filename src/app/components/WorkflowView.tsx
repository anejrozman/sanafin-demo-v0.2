import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Database, ShieldCheck, FileText, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { type PatientRecord, PATIENT_CSV_COLUMNS } from '../../lib/schema';
import { type Thresholds } from '../../lib/thresholds';
import {
  evaluateCohort,
  getCohortSummary,
  type PatientEvaluation,
  type CohortSummary,
} from '../../lib/selectors';

type NodeStatus = 'pending' | 'running' | 'done';
type NodeId = 'injection' | 'verification' | 'reporting';

interface WorkflowViewProps {
  filename: string;
  patients: PatientRecord[];
  thresholds: Thresholds;
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

// ─── Drawer panels ─────────────────────────────────────────────────────────────
function InjectionDrawer({ filename, patients }: { filename: string; patients: PatientRecord[] }) {
  const displayRows = patients.slice(0, 10);
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
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Detected columns</p>
        <div className="flex flex-wrap gap-1.5">
          {PATIENT_CSV_COLUMNS.map(col => (
            <code key={col.name} className="text-xs bg-muted border border-border rounded px-1.5 py-0.5">{col.name}</code>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Patient records {patients.length > 10 ? `(first 10 of ${patients.length})` : ''}
        </p>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">patient_id</TableHead>
                <TableHead className="text-xs">HbA1c (base → latest)</TableHead>
                <TableHead className="text-xs">CGM TIR</TableHead>
                <TableHead className="text-xs">Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map(p => (
                <TableRow key={p.patient_id}>
                  <TableCell className="font-mono text-xs">{p.patient_id}</TableCell>
                  <TableCell className="text-xs">{p.baseline_hba1c} → {p.latest_hba1c}</TableCell>
                  <TableCell className="text-xs">{p.cgm_time_in_range}%</TableCell>
                  <TableCell className="text-xs">{p.enrollment_date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function VerificationDrawer({
  evaluations,
  thresholds,
}: {
  evaluations: PatientEvaluation[];
  thresholds: Thresholds;
}) {
  const enabledRules = thresholds.rules.filter(r => r.enabled);
  const passed = evaluations.filter(e => e.passed).length;
  const failed = evaluations.length - passed;
  const displayRows = evaluations.slice(0, 20);

  const policyLabel =
    thresholds.passPolicy === 'all'
      ? `All ${enabledRules.length} rules must pass`
      : thresholds.passPolicy === 'any'
      ? 'At least 1 rule must pass'
      : `At least ${thresholds.minRulesToPass ?? 1} rules must pass`;

  return (
    <div className="space-y-4">
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

      <div className="flex gap-3">
        <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{passed}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Passed</p>
        </div>
        <div className="flex-1 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{failed}</p>
          <p className="text-xs text-amber-600 mt-0.5">Flagged</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Per-patient results {evaluations.length > 20 ? `(first 20 of ${evaluations.length})` : ''}
        </p>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">HbA1c Δ</TableHead>
                <TableHead className="text-xs">CGM TIR</TableHead>
                <TableHead className="text-xs">Wt loss</TableHead>
                <TableHead className="text-xs">Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map(e => {
                const hba1c = e.metrics.hba1c_change;
                const cgm = e.metrics.cgm_time_in_range;
                const wt = e.metrics.weight_loss_pct;
                return (
                  <TableRow key={e.patientId}>
                    <TableCell className="font-mono text-xs">{e.patientId}</TableCell>
                    <TableCell className="text-xs">
                      {hba1c != null ? (
                        <span className={hba1c >= 0.5 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                          {hba1c >= 0 ? `−${hba1c.toFixed(1)}` : `+${Math.abs(hba1c).toFixed(1)}`} pp
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {cgm != null ? (
                        <span className={cgm >= 70 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                          {cgm}%
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {wt != null ? (
                        <span className={wt >= 5 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                          {wt.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {e.passed ? (
                        <Badge className="bg-emerald-600 text-white text-xs">Pass</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">Flagged</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function ReportingDrawer({
  evaluations,
  summary,
}: {
  evaluations: PatientEvaluation[];
  summary: CohortSummary;
}) {
  const passedEvals = evaluations.filter(e => e.passed);
  const displayRows = passedEvals.slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Verified outcomes</p>
            <p className="text-3xl font-bold text-emerald-800 mt-1">{summary.passed}</p>
            <p className="text-sm text-emerald-700 mt-1">patients with verified outcomes</p>
          </div>
          <Badge className="bg-emerald-600 text-white">Evidence ready</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-emerald-700">
          <span>Pass rate: <strong>{summary.passRate.toFixed(1)}%</strong></span>
          <span>Total cohort: <strong>{summary.total}</strong></span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Verified patients {passedEvals.length > 20 ? `(first 20 of ${passedEvals.length})` : ''}
        </p>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">HbA1c Δ</TableHead>
                <TableHead className="text-xs">CGM TIR</TableHead>
                <TableHead className="text-xs">Wt loss</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map(e => (
                <TableRow key={e.patientId}>
                  <TableCell className="font-mono text-xs">{e.patientId}</TableCell>
                  <TableCell className="text-xs text-emerald-600 font-medium">
                    {e.metrics.hba1c_change != null
                      ? `−${e.metrics.hba1c_change.toFixed(1)} pp`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-emerald-600 font-medium">
                    {e.metrics.cgm_time_in_range != null ? `${e.metrics.cgm_time_in_range}%` : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-emerald-600 font-medium">
                    {e.metrics.weight_loss_pct != null
                      ? `${e.metrics.weight_loss_pct.toFixed(1)}%`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-600 text-white text-xs">Verified</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function WorkflowView({ filename, patients, thresholds }: WorkflowViewProps) {
  const [nodeStatuses, setNodeStatuses] = useState<Record<NodeId, NodeStatus>>({
    injection: 'pending',
    verification: 'pending',
    reporting: 'pending',
  });
  const [connectorActive, setConnectorActive] = useState({ c1: false, c2: false });
  const [connectorAnimated, setConnectorAnimated] = useState({ c1: false, c2: false });
  const [drawerOpen, setDrawerOpen] = useState<NodeId | null>(null);

  const evaluations = useMemo(() => evaluateCohort(patients, thresholds), [patients, thresholds]);
  const summary = useMemo(() => getCohortSummary(patients, thresholds), [patients, thresholds]);
  const enabledRules = thresholds.rules.filter(r => r.enabled);

  useEffect(() => {
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
    const t8 = setTimeout(() => setNodeStatuses(s => ({ ...s, reporting: 'done' })), 4800);
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
            <span className="text-emerald-600 font-semibold">{summary.passed} passed</span>
            {' · '}
            <span className="text-amber-600 font-semibold">{summary.failed} flagged</span>
          </p>
          <p>{enabledRules.length} clinical rule{enabledRules.length !== 1 ? 's' : ''}</p>
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
          <p className="font-semibold text-emerald-700">{summary.passed} verified outcomes</p>
          <p>Evidence ready</p>
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
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
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
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-violet-600" />
              Verification
            </SheetTitle>
            <SheetDescription>Clinical rule gates and per-patient verdicts</SheetDescription>
          </SheetHeader>
          <VerificationDrawer evaluations={evaluations} thresholds={thresholds} />
        </SheetContent>
      </Sheet>

      <Sheet open={drawerOpen === 'reporting'} onOpenChange={v => !v && setDrawerOpen(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="size-5 text-emerald-600" />
              Reporting
            </SheetTitle>
            <SheetDescription>Verified outcomes and evidence package</SheetDescription>
          </SheetHeader>
          <ReportingDrawer evaluations={evaluations} summary={summary} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
