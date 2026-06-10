import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Database, ShieldCheck, Banknote, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';

// ─── Sample cohort data ────────────────────────────────────────────────────────
const patients = [
  { id: 'P001', hba1c_baseline: 7.8, hba1c_followup: 7.1, cgm_tir: 68, date: '2026-06-01' },
  { id: 'P002', hba1c_baseline: 8.2, hba1c_followup: 7.5, cgm_tir: 71, date: '2026-06-01' },
  { id: 'P003', hba1c_baseline: 7.4, hba1c_followup: 7.0, cgm_tir: 65, date: '2026-06-02' },
  { id: 'P004', hba1c_baseline: 9.1, hba1c_followup: 8.4, cgm_tir: 58, date: '2026-06-02' },
  { id: 'P005', hba1c_baseline: 7.6, hba1c_followup: 7.2, cgm_tir: 72, date: '2026-06-03' },
  { id: 'P006', hba1c_baseline: 8.9, hba1c_followup: 8.6, cgm_tir: 54, date: '2026-06-03' },
  { id: 'P007', hba1c_baseline: 7.3, hba1c_followup: 6.8, cgm_tir: 79, date: '2026-06-04' },
  { id: 'P008', hba1c_baseline: 8.5, hba1c_followup: 7.8, cgm_tir: 67, date: '2026-06-04' },
  { id: 'P009', hba1c_baseline: 7.9, hba1c_followup: 7.3, cgm_tir: 70, date: '2026-06-05' },
  { id: 'P010', hba1c_baseline: 8.0, hba1c_followup: 7.8, cgm_tir: 61, date: '2026-06-05' },
  { id: 'P011', hba1c_baseline: 9.3, hba1c_followup: 8.5, cgm_tir: 55, date: '2026-06-06' },
  { id: 'P012', hba1c_baseline: 7.7, hba1c_followup: 7.1, cgm_tir: 74, date: '2026-06-06' },
];

const THRESHOLD = 0.5; // HbA1c drop required
const PAYOUT_PER_PATIENT = 420; // CHF

type NodeStatus = 'pending' | 'running' | 'done';
type NodeId = 'injection' | 'verification' | 'payout';

interface WorkflowViewProps {
  filename: string;
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
        {/* Arrowhead */}
        {active && (
          <polygon points="58,15 64,20 58,25" fill="#55B4A6" />
        )}
        {!active && (
          <polygon points="58,15 64,20 58,25" fill="#e8e0d8" />
        )}
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
        ${status === 'running' ? `border-brand-teal/40 bg-brand-teal/10 shadow-md` : ''}
        ${status === 'done' ? `${color.ring} bg-background shadow-sm hover:shadow-md cursor-pointer` : ''}
      `}
      whileHover={status === 'done' ? { scale: 1.02 } : {}}
      whileTap={status === 'done' ? { scale: 0.98 } : {}}
    >
      {/* Status dot */}
      <div className="absolute top-3 right-3">
        {status === 'running' && (
          <Loader2 className="size-4 text-brand-teal animate-spin" />
        )}
        {status === 'done' && (
          <CheckCircle className="size-4 text-emerald-500" />
        )}
      </div>

      {/* Icon */}
      <div className={`size-12 rounded-xl ${status === 'done' ? color.bg : 'bg-muted'} flex items-center justify-center`}>
        <Icon className={`size-6 ${status === 'done' ? color.icon : 'text-muted-foreground'}`} />
      </div>

      {/* Label */}
      <div>
        <p className={`font-semibold text-sm ${status === 'done' ? color.text : 'text-muted-foreground'}`}>{label}</p>
      </div>

      {/* Summary */}
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
function InjectionDrawer({ filename }: { filename: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Source</p>
          <p className="font-medium mt-0.5">{filename}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Format</p>
          <p className="font-medium mt-0.5">CSV / FHIR JSON</p>
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
          {['patient_id', 'HbA1c_baseline', 'HbA1c_followup', 'CGM_time_in_range', 'date'].map(col => (
            <code key={col} className="text-xs bg-muted border border-border rounded px-1.5 py-0.5">{col}</code>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Patient records</p>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">patient_id</TableHead>
                <TableHead className="text-xs">HbA1c</TableHead>
                <TableHead className="text-xs">CGM_TIR</TableHead>
                <TableHead className="text-xs">date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="text-xs">{p.hba1c_baseline} → {p.hba1c_followup}</TableCell>
                  <TableCell className="text-xs">{p.cgm_tir}%</TableCell>
                  <TableCell className="text-xs">{p.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function VerificationDrawer() {
  const results = patients.map(p => ({
    ...p,
    drop: +(p.hba1c_baseline - p.hba1c_followup).toFixed(1),
    pass: p.hba1c_baseline - p.hba1c_followup >= THRESHOLD,
  }));
  const passed = results.filter(r => r.pass).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm">
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">Contract rule</p>
        <code className="text-xs block bg-background border border-violet-100 rounded p-3 leading-relaxed">
          IF HbA1c_drop ≥ {THRESHOLD} pct_points<br />
          → T2D Prevention Success → <span className="text-emerald-600 font-semibold">ELIGIBLE FOR PAYOUT</span><br />
          ELSE → <span className="text-red-500 font-semibold">FLAGGED</span>
        </code>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{passed}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Passed</p>
        </div>
        <div className="flex-1 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{patients.length - passed}</p>
          <p className="text-xs text-amber-600 mt-0.5">Flagged</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Per-patient results</p>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">HbA1c drop</TableHead>
                <TableHead className="text-xs">Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-xs">
                    <span className={r.drop >= THRESHOLD ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                      −{r.drop} pp
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.pass ? (
                      <Badge className="bg-emerald-600 text-white text-xs">Pass</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">Flagged</Badge>
                    )}
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

function PayoutDrawer() {
  const passed = patients.filter(p => p.hba1c_baseline - p.hba1c_followup >= THRESHOLD);
  const total = passed.length * PAYOUT_PER_PATIENT;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Total released</p>
            <p className="text-3xl font-bold text-emerald-800 mt-1">CHF {total.toLocaleString()}</p>
          </div>
          <Badge className="bg-emerald-600 text-white">Settled</Badge>
        </div>
        <div className="mt-3 flex gap-4 text-sm text-emerald-700">
          <span>From: <strong>Escrow Pool</strong></span>
          <span>→</span>
          <span>To: <strong>Clinic Account</strong></span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Transaction ledger</p>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">Amount (CHF)</TableHead>
                <TableHead className="text-xs">From</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passed.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="text-xs font-semibold text-emerald-700">
                    {PAYOUT_PER_PATIENT.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">Escrow Pool</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-600 text-white text-xs">Settled</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-semibold">
                <TableCell className="text-xs">Total</TableCell>
                <TableCell className="text-xs text-emerald-700">CHF {total.toLocaleString()}</TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function WorkflowView({ filename }: WorkflowViewProps) {
  const [nodeStatuses, setNodeStatuses] = useState<Record<NodeId, NodeStatus>>({
    injection: 'pending',
    verification: 'pending',
    payout: 'pending',
  });
  const [connectorActive, setConnectorActive] = useState({ c1: false, c2: false });
  const [connectorAnimated, setConnectorAnimated] = useState({ c1: false, c2: false });
  const [drawerOpen, setDrawerOpen] = useState<NodeId | null>(null);

  const passed = patients.filter(p => p.hba1c_baseline - p.hba1c_followup >= THRESHOLD).length;
  const flagged = patients.length - passed;
  const total = passed * PAYOUT_PER_PATIENT;

  useEffect(() => {
    // Sequence: injection 0→1.2s, connector1 1.2s, verification 1.4→2.6s, connector2 2.6s, payout 2.8→4s
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
    const t7 = setTimeout(() => setNodeStatuses(s => ({ ...s, payout: 'running' })), 3500);
    const t8 = setTimeout(() => setNodeStatuses(s => ({ ...s, payout: 'done' })), 4800);
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
          <p className="font-semibold text-foreground">CSV / FHIR JSON</p>
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
          <p><span className="text-emerald-600 font-semibold">{passed} passed</span> · <span className="text-amber-600 font-semibold">{flagged} flagged</span></p>
          <p>HbA1c drop ≥ 0.5 pp</p>
        </>
      ),
    },
    {
      id: 'payout',
      icon: Banknote,
      label: 'Payout',
      color: { ring: 'border-emerald-200', bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
      summary: (
        <>
          <p className="font-semibold text-emerald-700">CHF {total.toLocaleString()} released</p>
          <p>Escrow → Clinic · Settled</p>
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

      {/* Workflow canvas */}
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

      {/* Side drawers */}
      <Sheet open={drawerOpen === 'injection'} onOpenChange={(v) => !v && setDrawerOpen(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Database className="size-5 text-blue-600" />
              Data Injection
            </SheetTitle>
            <SheetDescription>Ingested records and detected schema</SheetDescription>
          </SheetHeader>
          <InjectionDrawer filename={filename} />
        </SheetContent>
      </Sheet>

      <Sheet open={drawerOpen === 'verification'} onOpenChange={(v) => !v && setDrawerOpen(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-violet-600" />
              Verification
            </SheetTitle>
            <SheetDescription>Clinical rule gates and per-patient verdicts</SheetDescription>
          </SheetHeader>
          <VerificationDrawer />
        </SheetContent>
      </Sheet>

      <Sheet open={drawerOpen === 'payout'} onOpenChange={(v) => !v && setDrawerOpen(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Banknote className="size-5 text-emerald-600" />
              Payout
            </SheetTitle>
            <SheetDescription>Escrow release and transaction ledger</SheetDescription>
          </SheetHeader>
          <PayoutDrawer />
        </SheetContent>
      </Sheet>
    </div>
  );
}
