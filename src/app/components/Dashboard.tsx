import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from './ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import {
  Table, TableBody, TableHead, TableHeader, TableRow, TableCell,
} from './ui/table';
import { useData } from '../../store/DataContext';
import {
  getCohortSummary, getRulePerformance, getEnrollmentSpan,
  getAsOfDate, partitionByStatus,
  classifyCohort, getByCategory, getFlaggedSorted,
  type ClassifiedPatient,
} from '../../lib/selectors';
import { DEFAULT_THRESHOLDS } from '../../lib/thresholds';
import type { PatientRecord } from '../../lib/schema';
import DashboardPipeline from './DashboardPipeline';
import InjectionPanel from './InjectionPanel';
import OutcomeTargetsPanel from './OutcomeTargetsPanel';

function fmtDate(iso: string) {
  const [y, m] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function fmt(v: number | null, decimals = 1): string {
  return v != null ? v.toFixed(decimals) : '—';
}

function SectionHeader({ title, count, accent }: { title: string; count: number; accent: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 pb-3 border-b-2 ${accent}`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <span className="text-sm text-muted-foreground tabular-nums">{count} patients</span>
    </div>
  );
}

function StatTiles({
  count,
  rateLabel,
  rateValue,
  hba1c,
  cgm,
  weight,
}: {
  count: number;
  rateLabel: string;
  rateValue: number;
  hba1c: number | null;
  cgm: number | null;
  weight: number | null;
}) {
  const tiles = [
    { label: 'Patients', value: count.toString() },
    { label: rateLabel, value: `${rateValue.toFixed(1)}%` },
    { label: 'Avg HbA1c Δ', value: hba1c != null ? `${fmt(hba1c)} pp` : '—' },
    { label: 'Avg CGM TiR', value: cgm != null ? `${fmt(cgm)}%` : '—' },
    { label: 'Avg Weight Loss', value: weight != null ? `${fmt(weight)}%` : '—' },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {tiles.map(t => (
        <div key={t.label} className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t.label}</p>
          <p className="text-lg font-bold mt-0.5">{t.value}</p>
        </div>
      ))}
    </div>
  );
}

function MetricChips({ ruleResults }: {
  ruleResults: { ruleId: string; label: string; actual: number | null; unit: string; passed: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {ruleResults.map(r => {
        const val = r.actual != null
          ? `${Number.isInteger(r.actual) ? r.actual : r.actual.toFixed(1)} ${r.unit}`
          : '—';
        return (
          <span
            key={r.ruleId}
            className={`text-xs rounded-full px-2 py-0.5 border font-medium ${
              r.passed
                ? 'border-brand-teal text-brand-teal bg-brand-teal/8'
                : 'border-brand-amber text-brand-amber bg-brand-amber/8'
            }`}
          >
            {r.label}: {val}
          </span>
        );
      })}
    </div>
  );
}

function CollapsiblePatientTable({
  title,
  patients,
  emptyMessage,
  accentColor,
}: {
  title: string;
  patients: ClassifiedPatient[];
  emptyMessage: string;
  accentColor: 'teal' | 'amber';
}) {
  const [open, setOpen] = useState(false);
  const count = patients.length;
  const titleColor = accentColor === 'teal' ? 'text-brand-teal' : 'text-brand-amber';
  const ruleHeaders = count > 0 ? patients[0].evaluation.ruleResults : [];
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`font-semibold text-sm ${titleColor}`}>{title}</span>
            <span className="text-xs text-muted-foreground tabular-nums">({count})</span>
          </div>
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:[animation:collapsible-down_200ms_ease-out] data-[state=closed]:[animation:collapsible-up_200ms_ease-out]">
        {count === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
        ) : (
          <div className="mt-2 rounded-xl border overflow-hidden">
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Patient ID</TableHead>
                    {ruleHeaders.map(r => (
                      <TableHead key={r.ruleId} className="text-xs font-semibold">{r.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map(c => (
                    <TableRow key={c.patient.patient_id}>
                      <TableCell className="font-mono text-xs font-medium">{c.patient.patient_id}</TableCell>
                      {c.evaluation.ruleResults.map(r => (
                        <TableCell
                          key={r.ruleId}
                          className={`text-xs font-semibold ${r.passed ? 'text-brand-teal' : 'text-brand-amber'}`}
                        >
                          {r.actual != null
                            ? `${Number.isInteger(r.actual) ? r.actual : r.actual.toFixed(1)} ${r.unit}`
                            : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

const PATIENT_COLUMNS: { key: keyof PatientRecord; label: string }[] = [
  { key: 'patient_id', label: 'Patient ID' },
  { key: 'enrollment_date', label: 'Enrolled' },
  { key: 'end_date', label: 'End Date' },
  { key: 'last_measurement_date', label: 'Measured' },
  { key: 'baseline_hba1c', label: 'HbA1c (B)' },
  { key: 'latest_hba1c', label: 'HbA1c (L)' },
  { key: 'cgm_time_in_range', label: 'CGM TiR' },
  { key: 'baseline_weight_kg', label: 'Weight (B)' },
  { key: 'latest_weight_kg', label: 'Weight (L)' },
  { key: 'sessions_attended', label: 'Sessions' },
  { key: 'total_sessions', label: 'Total Sess.' },
];

function InjectionDialog({
  open,
  onOpenChange,
  onCohortLoaded,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCohortLoaded: () => void;
  onClear: () => void;
}) {
  const { patients, processed, clearUploadedData, dataSource } = useData();
  const [panelKey, setPanelKey] = useState(0);

  function handleClear() {
    clearUploadedData();
    setPanelKey(k => k + 1);
    onClear();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`overflow-y-auto max-h-[90vh] ${processed ? 'sm:max-w-[1100px]' : 'sm:max-w-5xl'}`}>
        <DialogHeader>
          <DialogTitle>Load Patient Cohort</DialogTitle>
          <DialogDescription>
            {processed
              ? `${patients.length} patients ingested from ${dataSource === 'sample' ? 'sample dataset' : 'uploaded file'}.`
              : 'Use the sample dataset or upload your own CSV to begin outcome analysis.'}
          </DialogDescription>
        </DialogHeader>
        {processed ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">{patients.length} patients ingested</p>
              <Button variant="outline" size="sm" onClick={handleClear}>Clear data</Button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-xs border-collapse min-w-[900px]">
                  <thead className="sticky top-0 bg-background z-10 border-b">
                    <tr>
                      {PATIENT_COLUMNS.map(col => (
                        <th key={col.key} className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, i) => (
                      <tr key={p.patient_id} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                        {PATIENT_COLUMNS.map(col => (
                          <td key={col.key} className="px-3 py-2 whitespace-nowrap font-mono border-b border-border/30">
                            {String(p[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <InjectionPanel
            key={panelKey}
            onCohortLoaded={onCohortLoaded}
            onRequestClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function VerificationDialog({
  open,
  onOpenChange,
  onConfirmed,
  verificationConfirmed,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
  verificationConfirmed: boolean;
  onReset: () => void;
}) {
  const { patients, thresholds, setThresholds } = useData();
  const [view, setView] = useState<'editor' | 'results'>('editor');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      setView(verificationConfirmed ? 'results' : 'editor');
      setExpanded(false);
    }
  }, [open, verificationConfirmed]);

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const classified = useMemo(() => classifyCohort(patients, thresholds, asOf), [patients, thresholds, asOf]);
  const cats = useMemo(() => getByCategory(classified), [classified]);

  const CATEGORY_GROUPS = [
    { title: 'On track', desc: 'In treatment, currently meeting targets', list: cats.onTrack, teal: true },
    { title: 'At risk', desc: 'In treatment, targets not yet met', list: cats.flagged, teal: false },
    { title: 'Passed', desc: 'Completed treatment, met all targets', list: cats.pass, teal: true },
    { title: 'Missed', desc: 'Completed treatment, did not meet targets', list: cats.fail, teal: false },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`overflow-y-auto max-h-[90vh] ${expanded ? 'sm:max-w-[1100px]' : 'sm:max-w-5xl'}`}>
        <DialogHeader>
          <DialogTitle>Outcome Targets</DialogTitle>
          <DialogDescription>
            {view === 'editor'
              ? 'Review and configure the clinical goals used for outcome verification.'
              : 'Patient outcomes categorized by treatment status and target achievement.'}
          </DialogDescription>
        </DialogHeader>

        {view === 'editor' ? (
          <>
            <OutcomeTargetsPanel />
            <DialogFooter>
              <Button onClick={onConfirmed}>Select Targets</Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setView('editor'); onReset(); }}>
                Reset thresholds
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setThresholds(DEFAULT_THRESHOLDS); setView('editor'); onReset(); }}>
                Use base settings
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-brand-teal" />
                <span>On track / Passed — meeting targets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-brand-amber" />
                <span>At risk / Missed — targets not met</span>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-xl border bg-muted/30 p-4 hover:bg-muted/50 transition-colors select-none"
              onClick={() => setExpanded(e => !e)}
              onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {expanded ? 'Hide patient details' : 'View patient details'}
                </p>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {CATEGORY_GROUPS.map(cat => (
                  <div key={cat.title} className="flex items-baseline gap-2.5">
                    <span className={`text-3xl font-bold tabular-nums leading-none ${cat.teal ? 'text-brand-teal' : 'text-brand-amber'}`}>
                      {cat.list.length}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold leading-tight ${cat.teal ? 'text-brand-teal' : 'text-brand-amber'}`}>{cat.title}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {expanded && (
              <div className="space-y-5">
                {CATEGORY_GROUPS.map(cat => (
                  <div key={cat.title}>
                    <div className={`flex items-center gap-2 pb-1.5 mb-2 border-b-2 ${cat.teal ? 'border-brand-teal/40' : 'border-brand-amber/40'}`}>
                      <h3 className={`text-sm font-semibold ${cat.teal ? 'text-brand-teal' : 'text-brand-amber'}`}>{cat.title}</h3>
                      <span className="text-xs text-muted-foreground">({cat.list.length} patients)</span>
                    </div>
                    {cat.list.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-3 text-center">No patients in this category.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <div className="overflow-y-auto max-h-[380px]">
                          <table className="w-full text-xs border-collapse min-w-[900px]">
                            <thead className="sticky top-0 bg-background z-10 border-b">
                              <tr>
                                {PATIENT_COLUMNS.map(col => (
                                  <th key={col.key} className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cat.list.map((c, i) => (
                                <tr key={c.patient.patient_id} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                                  {PATIENT_COLUMNS.map(col => (
                                    <td key={col.key} className="px-3 py-2 whitespace-nowrap font-mono border-b border-border/30">
                                      {String(c.patient[col.key])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { patients, thresholds, dataSource, isLoading, processed } = useData();
  const [injectionOpen, setInjectionOpen] = useState(false);
  const [injectionLoading, setInjectionLoading] = useState(false);
  const injectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(() => processed);
  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [reportingStatus, setReportingStatus] = useState<'idle' | 'processing' | 'done'>(() => processed ? 'done' : 'idle');
  const reportingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const injectionNodeStatus = injectionLoading ? 'processing' : processed ? 'done' : 'idle';
  const verificationNodeStatus = verificationLoading ? 'processing' : verificationConfirmed ? 'done' : 'idle';
  const firstTwoDone = injectionNodeStatus === 'done' && verificationNodeStatus === 'done';
  const allDone = firstTwoDone && reportingStatus === 'done';

  function handleCohortLoaded() {
    setInjectionOpen(false);
    if (injectionTimerRef.current) clearTimeout(injectionTimerRef.current);
    setInjectionLoading(true);
    injectionTimerRef.current = setTimeout(() => setInjectionLoading(false), 2000);
  }

  function handleClear() {
    if (injectionTimerRef.current) clearTimeout(injectionTimerRef.current);
    setInjectionLoading(false);
    if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
    setVerificationLoading(false);
    setVerificationConfirmed(false);
    if (reportingTimerRef.current) clearTimeout(reportingTimerRef.current);
    setReportingStatus('idle');
  }

  function handleVerificationConfirmed() {
    setVerificationOpen(false);
    if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
    setVerificationConfirmed(true);
    setVerificationLoading(true);
    verificationTimerRef.current = setTimeout(() => setVerificationLoading(false), 2000);
  }

  function handleVerificationReset() {
    if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
    setVerificationLoading(false);
    setVerificationConfirmed(false);
  }

  function handleReportingClick() {
    if (reportingStatus === 'done') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (reportingTimerRef.current) clearTimeout(reportingTimerRef.current);
    setReportingStatus('processing');
    reportingTimerRef.current = setTimeout(() => setReportingStatus('done'), 2000);
  }

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const { completed, active } = useMemo(() => partitionByStatus(patients, asOf), [patients, asOf]);

  const summary      = useMemo(() => getCohortSummary(completed, thresholds), [completed, thresholds]);
  const activeSummary = useMemo(() => getCohortSummary(active, thresholds), [active, thresholds]);
  const rulePerf     = useMemo(() => getRulePerformance(completed, thresholds), [completed, thresholds]);
  const span         = useMemo(() => getEnrollmentSpan(patients), [patients]);
  const classified   = useMemo(() => classifyCohort(patients, thresholds, asOf), [patients, thresholds, asOf]);
  const cats         = useMemo(() => getByCategory(classified), [classified]);
  const flaggedSorted = useMemo(() => getFlaggedSorted(classified), [classified]);

  const verificationCounts = verificationConfirmed ? {
    onTrack: cats.onTrack.length,
    atRisk: cats.flagged.length,
    passed: cats.pass.length,
    missed: cats.fail.length,
  } : undefined;

  const injectionCount = processed ? patients.length : undefined;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Loading cohort data…</p>
        </div>
      </div>
    );
  }

  if (!allDone) {
    const anyLoading = injectionNodeStatus === 'processing' || verificationNodeStatus === 'processing' || reportingStatus === 'processing';
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1>Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Cohort outcome verification summary</p>
          </div>
          {processed && (
            <Badge variant={dataSource === 'uploaded' ? 'default' : 'outline'} className="mt-1 flex-shrink-0">
              {dataSource === 'uploaded' ? 'Uploaded data' : 'Sample data'}
            </Badge>
          )}
        </div>

        <DashboardPipeline
          onInjectionClick={() => setInjectionOpen(true)}
          injectionStatus={injectionNodeStatus}
          injectionCount={injectionCount}
          onVerificationClick={() => setVerificationOpen(true)}
          verificationStatus={verificationNodeStatus}
          verificationCounts={verificationCounts}
          reportingStatus={reportingStatus}
          onReportingClick={firstTwoDone ? handleReportingClick : undefined}
        />

        {/* Blurred skeleton + overlay */}
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none space-y-8" aria-hidden="true">
            {/* Completed section skeleton */}
            <div className="space-y-5">
              <div className="h-5 w-56 rounded bg-muted" />
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-muted/80 h-[68px]" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-xl border bg-card h-52" />
                <div className="rounded-xl border bg-card h-52" />
              </div>
              <div className="rounded-xl border bg-card h-36" />
            </div>

            {/* Active section skeleton */}
            <div className="space-y-5">
              <div className="h-5 w-48 rounded bg-muted" />
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-muted/80 h-[68px]" />
                ))}
              </div>
              <div className="rounded-xl border bg-card h-44" />
              <div className="rounded-xl border bg-card h-36" />
            </div>
          </div>

          {!anyLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              {!processed ? (
                <div className="flex flex-col items-center gap-4 text-center max-w-xs bg-background/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border">
                  <p className="font-semibold">No cohort loaded yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click Data Injection above to load your cohort.
                  </p>
                  <Button onClick={() => setInjectionOpen(true)}>Load Data</Button>
                </div>
              ) : !verificationConfirmed ? (
                <div className="flex flex-col items-center gap-4 text-center max-w-xs bg-background/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border">
                  <p className="font-semibold">Confirm outcome targets</p>
                  <p className="text-sm text-muted-foreground">
                    Click Verification above to review and confirm your clinical goals.
                  </p>
                  <Button onClick={() => setVerificationOpen(true)}>Set Outcome Targets</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center max-w-xs bg-background/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border">
                  <p className="font-semibold">Ready to generate report</p>
                  <p className="text-sm text-muted-foreground">
                    Click Reporting above to generate and view the full results.
                  </p>
                  <Button onClick={handleReportingClick}>Generate Report</Button>
                </div>
              )}
            </div>
          )}
        </div>

        <InjectionDialog open={injectionOpen} onOpenChange={setInjectionOpen} onCohortLoaded={handleCohortLoaded} onClear={handleClear} />
        <VerificationDialog open={verificationOpen} onOpenChange={setVerificationOpen} onConfirmed={handleVerificationConfirmed} verificationConfirmed={verificationConfirmed} onReset={handleVerificationReset} />
      </div>
    );
  }

  const enabledRules = thresholds.rules.filter(r => r.enabled);
  const failRate = 100 - summary.passRate;
  const onTrackRate = active.length > 0 ? (cats.onTrack.length / active.length) * 100 : 0;
  const flaggedRate = 100 - onTrackRate;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {span
              ? `${fmtDate(span.earliestEnrollment)} – ${fmtDate(span.latestMeasurement)} · ${patients.length} patients · ${completed.length} completed · ${active.length} active`
              : 'Cohort outcome verification summary'}
          </p>
        </div>
        <Badge
          variant={dataSource === 'uploaded' ? 'default' : 'outline'}
          className="mt-1 flex-shrink-0"
        >
          {dataSource === 'uploaded' ? 'Uploaded data' : 'Sample data'}
        </Badge>
      </div>

      <DashboardPipeline
        onInjectionClick={() => setInjectionOpen(true)}
        injectionStatus={injectionNodeStatus}
        injectionCount={injectionCount}
        onVerificationClick={() => setVerificationOpen(true)}
        verificationStatus={verificationNodeStatus}
        verificationCounts={verificationCounts}
        reportingStatus={reportingStatus}
        onReportingClick={handleReportingClick}
      />

      <div ref={resultsRef}>
      {/* ── ACTIVE (IN TREATMENT) ────────────────────────────────────────────── */}
      <div className="mt-8 space-y-5">
        <SectionHeader title="Active (in treatment)" count={active.length} accent="border-brand-teal" />

        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patients currently in treatment.</p>
        ) : (
          <>
            <StatTiles
              count={active.length}
              rateLabel="On-track rate"
              rateValue={onTrackRate}
              hba1c={activeSummary.avgHba1cChange}
              cgm={activeSummary.avgCgmTimeInRange}
              weight={activeSummary.avgWeightLossPct}
            />

            {/* On-track vs flagged breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status Breakdown</CardTitle>
                <CardDescription>
                  Active patients currently meeting vs not yet meeting targets — mid-program snapshot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div className="border border-brand-teal/50 bg-brand-teal/20 transition-all duration-500 rounded-l-full" style={{ width: `${onTrackRate}%` }} />
                  <div className="border border-brand-amber/50 bg-brand-amber/20 flex-1 rounded-r-full" />
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'On track', count: cats.onTrack.length, rate: onTrackRate, dotColor: 'border-brand-teal bg-brand-teal/20', textColor: 'text-brand-teal' },
                    { label: 'At risk', count: cats.flagged.length, rate: flaggedRate, dotColor: 'border-brand-amber bg-brand-amber/20', textColor: 'text-brand-amber' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`size-2.5 rounded-full border ${row.dotColor} flex-shrink-0`} />
                        <span className="text-sm">{row.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{row.count}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{row.rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground border-t pt-3">
                  "On track" = currently meeting all enabled targets.
                </p>
              </CardContent>
            </Card>

            <CollapsiblePatientTable
              title="At Risk"
              patients={flaggedSorted}
              emptyMessage="All active patients are currently meeting their targets."
              accentColor="amber"
            />
          </>
        )}
      </div>

      {/* ── COMPLETED TREATMENT ─────────────────────────────────────────────── */}
      <div className="mt-8 space-y-5">
        <SectionHeader title="Completed treatment" count={completed.length} accent="border-brand-teal" />

        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patients have completed treatment yet.</p>
        ) : (
          <>
            <StatTiles
              count={completed.length}
              rateLabel="Pass rate"
              rateValue={summary.passRate}
              hba1c={summary.avgHba1cChange}
              cgm={summary.avgCgmTimeInRange}
              weight={summary.avgWeightLossPct}
            />

            {/* Outcome breakdown + target pass-rate chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Target Pass Rates</CardTitle>
                  <CardDescription>
                    Share of completed patients meeting each threshold
                    {rulePerf.length > 0 && (
                      <span className="ml-1">
                        — bottleneck:{' '}
                        <span className="font-medium text-foreground">
                          {rulePerf.reduce((min, r) => r.passRate < min.passRate ? r : min).label}
                        </span>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rulePerf}
                        layout="vertical"
                        margin={{ left: 8, right: 40, top: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={v => `${v}%`}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={150}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(v) => [`${(v as number).toFixed(1)}%`, 'Pass rate']}
                          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        />
                        <Bar dataKey="passRate" radius={[0, 4, 4, 0]} maxBarSize={32}>
                          {rulePerf.map(entry => (
                            <Cell key={entry.ruleId} fill={entry.passRate >= 70 ? '#55B4A6' : '#E9A23B'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Teal = ≥ 70% pass rate · Amber = below 70%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outcome Breakdown</CardTitle>
                  <CardDescription>
                    Pass vs fail · {enabledRules.length} rule{enabledRules.length !== 1 ? 's' : ''} · completed patients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="h-3 rounded-full overflow-hidden flex">
                    <div className="bg-brand-teal transition-all duration-500" style={{ width: `${summary.passRate}%` }} />
                    <div className="bg-brand-amber flex-1" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Pass', count: summary.passed, rate: summary.passRate, color: 'bg-brand-teal' },
                      { label: 'Fail', count: summary.failed, rate: failRate, color: 'bg-brand-amber' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`size-2.5 rounded-full ${row.color} flex-shrink-0`} />
                          <span className="text-sm">{row.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">{row.count}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">{row.rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Pass policy:</span>{' '}
                      {thresholds.passPolicy === 'all'
                        ? `all ${enabledRules.length} rules`
                        : thresholds.passPolicy === 'any'
                        ? 'any 1 rule'
                        : `≥ ${thresholds.minRulesToPass ?? 1} rules`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <CollapsiblePatientTable
              title="Needs Review"
              patients={cats.fail}
              emptyMessage="All completed patients met their outcome targets."
              accentColor="amber"
            />
          </>
        )}
      </div>

      </div>
      <InjectionDialog open={injectionOpen} onOpenChange={setInjectionOpen} onCohortLoaded={handleCohortLoaded} onClear={handleClear} />
      <VerificationDialog open={verificationOpen} onOpenChange={setVerificationOpen} onConfirmed={handleVerificationConfirmed} verificationConfirmed={verificationConfirmed} onReset={handleVerificationReset} />
    </div>
  );
}
