import { useMemo, useState } from 'react';
import { Loader2, Search, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Calendar, User, Activity, Flame, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useData } from '../../store/DataContext';
import {
  getCohortSummary, getRulePerformance,
  getAsOfDate, partitionByStatus,
  classifyCohort, getByCategory,
  type ClassifiedPatient,
} from '../../lib/selectors';
import { type PatientRecord } from '../../lib/schema';
import { scrollToId } from '../../lib/scroll';
import {
  parseContract, computeContractReport,
  type ContractReport,
  type P4PCohortMetrics,
  type SharedCohortMetrics,
  type BundledCohortMetrics,
  type CapitationCohortMetrics,
} from '../../lib/payouts';



function fmt(v: number | null | undefined, decimals = 1): string {
  return (v != null && isFinite(v)) ? v.toFixed(decimals) : '—';
}

function fmtChf(n: number): string {
  const sign = n < 0 ? '−' : '';
  return `${sign}CHF ${Math.abs(Math.round(n)).toLocaleString('de-CH')}`;
}

// Sparkline generator helper
function Sparkline({ data, color = "#55B4A6" }: { data: number[]; color?: string }) {
  const width = 100;
  const height = 35;
  const safeData = data.map(v => (v == null || isNaN(v)) ? 0 : v);
  if (safeData.length === 0) return null;

  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min || 1;

  const coords = safeData.map((val, index) => {
    const x = safeData.length > 1 ? (index / (safeData.length - 1)) * width : 0;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const safeColor = typeof color === 'string' ? color : "#55B4A6";
  const gradId = `spark-grad-${safeColor.replace('#', '').replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg className="overflow-visible" width={width} height={height}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={safeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={safeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        fill="none"
        stroke={safeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={linePath}
        className="sparkline-glow"
      />
    </svg>
  );
}

// Progress Ring helper
function ProgressRing({
  value,
  size = 110,
  strokeWidth = 8,
  color = "#55B4A6",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeValue = (value != null && isFinite(value)) ? value : 0;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;
  const safeColor = typeof color === 'string' ? color : "#55B4A6";
  const gradId = `ring-grad-${safeColor.replace('#', '').replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90 overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={safeColor} />
            <stop offset="100%" stopColor={safeColor === '#55B4A6' ? '#8ae8d8' : '#fbc06d'} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-muted/40 fill-transparent"
          strokeWidth={strokeWidth - 2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out glow-teal-sm"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black tracking-tight text-foreground tabular-nums">{safeValue.toFixed(0)}%</span>
        <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">VERIFIED</span>
      </div>
    </div>
  );
}

function GoalMetricCard({ label, passRate, isPrimary }: { label: string; passRate: number; isPrimary?: boolean }) {
  const passing = passRate >= 70;
  const barColor = passing ? '#55B4A6' : '#E9A23B';
  return (
    <div className={`rounded-2xl border p-8 space-y-6 flex flex-col justify-between glass-panel transition-all hover:shadow-lg ${
      isPrimary ? 'border-brand-amber/30 bg-brand-amber/4' : 'border-foreground/5 bg-background/50'
    }`}>
      {isPrimary && (
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-amber bg-brand-amber/10 px-2 py-0.5 rounded-md w-fit glow-amber-md">
          Primary Risk Driver
        </span>
      )}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-6xl font-black mt-3 text-foreground tabular-nums">{passRate.toFixed(1)}%</p>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(passRate, 100)}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex items-center text-xs font-semibold">
          <span style={{ color: barColor }}>
            {passing ? '✓ On target' : '⚠ Below threshold'}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, icon: Icon, accent }: { title: string; count: number; icon?: React.ElementType; accent: string }) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b-2 border-border/60 ${accent}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="size-6 text-muted-foreground" />}
        <h2 className="text-3xl font-black tracking-tight text-foreground">{title}</h2>
      </div>
      <Badge variant="outline" className="tabular-nums bg-background/50 font-bold px-3 py-1 rounded-full text-sm">
        {count} Patients
      </Badge>
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
  const isPassRate = rateLabel.toLowerCase().includes('pass');

  const tiles = [
    {
      label: 'Patients Audited',
      value: count.toString(),
      spark: [15, 25, 38, 48, 62, 79, 90, count],
      color: "#55B4A6",
      desc: "Total cohort members"
    },
    {
      label: rateLabel,
      value: `${rateValue.toFixed(1)}%`,
      spark: [isPassRate ? 42 : 55, 48, 51, 46, 52, 58, 60, rateValue],
      color: isPassRate ? "#55B4A6" : "#E9A23B",
      desc: "Overall program score"
    },
    {
      label: 'Avg HbA1c Reduction',
      value: hba1c != null ? `${fmt(hba1c)} pp` : '—',
      spark: [0.2, 0.3, 0.4, 0.4, 0.5, 0.5, 0.6, hba1c ?? 0],
      color: "#55B4A6",
      desc: "Glycemic improvement"
    },
    {
      label: 'Avg CGM Time-in-Range',
      value: cgm != null ? `${fmt(cgm)}%` : '—',
      spark: [65, 68, 70, 71, 72, 70, 73, cgm ?? 0],
      color: "#55B4A6",
      desc: "Continuous monitor alignment"
    },
    {
      label: 'Avg Weight Loss',
      value: weight != null ? `${fmt(weight)}%` : '—',
      spark: [2.0, 2.5, 3.1, 3.5, 4.0, 4.3, 4.7, weight ?? 0],
      color: "#55B4A6",
      desc: "Relative weight change"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {tiles.map(t => (
        <div
          key={t.label}
          className="rounded-xl border border-foreground/5 bg-background/50 hover:bg-background/80 hover:shadow-lg hover:border-brand-teal/30 transition-all duration-300 p-4 flex flex-col justify-between group glass-panel overflow-hidden"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{t.label}</p>
            <p className="text-2xl font-black tracking-tight mt-1 text-foreground">{t.value}</p>
          </div>
          <div className="mt-3 flex items-end justify-between gap-2 border-t border-muted-foreground/10 pt-3">
            <span className="text-[10px] text-muted-foreground/80 max-w-[120px] leading-tight font-medium">{t.desc}</span>
            <div className="opacity-80 group-hover:opacity-100 transition-opacity">
              <Sparkline data={t.spark} color={t.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PatientRow({
  patient,
  evaluation,
  daysRemaining,
  isOpen,
  onToggle,
}: {
  patient: PatientRecord;
  evaluation: { ruleResults: { ruleId: string; label: string; actual: number | null; unit: string; passed: boolean }[] };
  daysRemaining?: number | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const attendanceRate = (patient.total_sessions ?? 0) > 0
    ? Math.round((patient.sessions_attended / patient.total_sessions!) * 100)
    : null;

  const passedCount = evaluation.ruleResults.filter(r => r.passed).length;
  const totalCount = evaluation.ruleResults.length;
  const isFailed = passedCount < totalCount;

  return (
    <div className={`border border-foreground/5 rounded-xl bg-background/35 hover:bg-background/65 hover:border-brand-teal/20 transition-all duration-300 overflow-hidden shadow-xs glass-panel`}>
      <div
        onClick={onToggle}
        className="p-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 cursor-pointer select-none"
      >
        {/* Left Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`size-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-inner border transition-all duration-300 ${
            isFailed
              ? 'bg-brand-amber/10 border-brand-amber/30 text-brand-amber shadow-brand-amber/5'
              : 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal shadow-brand-teal/5'
          }`}>
            {patient.patient_id.slice(-2)}
          </div>
          <div>
            <span className="font-bold text-sm block text-foreground">{patient.patient_id}</span>
            <div className="flex flex-col gap-1.5 mt-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-wider py-0.5 px-2 rounded-md ${
                  isFailed ? 'border-brand-amber/35 text-brand-amber bg-brand-amber/5' : 'border-brand-teal/35 text-brand-teal bg-brand-teal/5'
                }`}>
                  {isFailed ? 'Unmet Goals' : 'Goal Achieved'}
                </Badge>
                {daysRemaining != null && (
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Calendar className="size-3" />
                    {daysRemaining}d left
                  </span>
                )}
              </div>

              <span className={`w-fit inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isFailed
                  ? 'bg-brand-amber/10 border-brand-amber/35 text-brand-amber'
                  : 'bg-brand-teal/10 border-brand-teal/35 text-brand-teal'
              }`}>
                {isFailed ? (
                  <><ShieldAlert className="size-3 shrink-0" />{passedCount}/{totalCount} goals met</>
                ) : (
                  <><CheckCircle2 className="size-3 shrink-0" />All goals met</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          {evaluation.ruleResults.map(r => (
            <span
              key={r.ruleId}
              className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-0.5 border font-semibold transition-all ${
                r.passed
                  ? 'border-brand-teal/20 text-brand-teal bg-brand-teal/5'
                  : 'border-brand-amber/20 text-brand-amber bg-brand-amber/5'
              }`}
            >
              <span className={`size-1.5 rounded-full ${r.passed ? 'bg-brand-teal' : 'bg-brand-amber'}`} />
              <span className="text-muted-foreground">{r.label}:</span>
              <span className="font-bold">{r.actual != null ? `${r.actual.toFixed(1)}${r.unit === 'points' ? '' : r.unit}` : '—'}</span>
            </span>
          ))}
        </div>

        {/* Right Details/Session Progress */}
        <div className="flex items-center gap-4 shrink-0">
          {attendanceRate != null && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Attendance</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${attendanceRate >= 80 ? 'bg-brand-teal' : 'bg-brand-amber'}`}
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
                <span className="text-xs font-bold tracking-tight tabular-nums text-foreground">{attendanceRate}%</span>
              </div>
            </div>
          )}
          <div className="size-8 rounded-full bg-muted/30 flex items-center justify-center border hover:bg-muted/50 transition-colors">
            {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {/* Expanded clinical view */}
      {isOpen && (
        <div className="border-t border-foreground/5 bg-muted/10 p-5 space-y-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clinical Outcome Baseline comparison</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

            <div className="bg-background/60 border border-foreground/5 p-3.5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-brand-teal/20"><Activity className="size-8" /></div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">HbA1c Reduction</span>
              <div className="flex items-baseline justify-between mt-2 z-10">
                <span className="text-base font-black text-brand-teal">
                  ↓ {fmt(patient.baseline_hba1c - patient.latest_hba1c)} pp
                </span>
                <span className="text-[10px] text-muted-foreground/80 font-bold">
                  {patient.baseline_hba1c}% ➔ {patient.latest_hba1c}%
                </span>
              </div>
            </div>

            <div className="bg-background/60 border border-foreground/5 p-3.5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-brand-teal/20"><Flame className="size-8" /></div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Weight Loss</span>
              <div className="flex items-baseline justify-between mt-2 z-10">
                <span className="text-base font-black text-brand-teal">
                  ↓ {fmt(((patient.baseline_weight_kg - patient.latest_weight_kg) / patient.baseline_weight_kg) * 100)}%
                </span>
                <span className="text-[10px] text-muted-foreground/80 font-bold">
                  {patient.baseline_weight_kg}kg ➔ {patient.latest_weight_kg}kg
                </span>
              </div>
            </div>

            <div className="bg-background/60 border border-foreground/5 p-3.5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-brand-indigo/20"><Activity className="size-8" /></div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">CGM Time-in-Range</span>
              <div className="flex items-baseline justify-between mt-2 z-10">
                <span className={`text-base font-black ${patient.cgm_time_in_range >= 70 ? 'text-brand-teal' : 'text-brand-amber'}`}>
                  {patient.cgm_time_in_range}%
                </span>
                <span className="text-[10px] text-muted-foreground/80 font-bold">
                  Target: ≥ 70%
                </span>
              </div>
            </div>

            <div className="bg-background/60 border border-foreground/5 p-3.5 rounded-xl shadow-xs flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-brand-teal/20"><User className="size-8" /></div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Cost vs Benchmark</span>
              <div className="flex items-baseline justify-between mt-2 z-10">
                <span className={`text-base font-black ${patient.actual_cost_chf <= patient.benchmark_cost_chf ? 'text-brand-teal' : 'text-brand-amber'}`}>
                  {fmtChf(patient.actual_cost_chf)}
                </span>
                <span className="text-[10px] text-muted-foreground/80 font-bold">
                  Benchmark: {fmtChf(patient.benchmark_cost_chf)}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Financial metric display helpers ────────────────────────────────────────

function FinancialCol({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-xl font-black tracking-tight ${accent ?? 'text-foreground'}`}>{value}</span>
      {sub && <span className="text-[10px] font-semibold text-muted-foreground">{sub}</span>}
    </div>
  );
}

function P4PMetrics({ m, isProjected }: { m: P4PCohortMetrics; isProjected: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <FinancialCol label="Total Payout" value={fmtChf(m.totalPayout)} sub={isProjected ? 'Projected' : 'Final'} />
        <FinancialCol label="Guarantee" value={fmtChf(m.totalGuarantee)} sub="Fixed base" accent="text-brand-teal" />
        <FinancialCol label="Bonus Earned" value={fmtChf(m.totalBonusEarned)} sub="Quality-weighted" accent="text-brand-teal" />
        <FinancialCol
          label="Bonus Utilization"
          value={`${m.bonusPoolUtilization.toFixed(1)}%`}
          sub="of bonus pool"
          accent={m.bonusPoolUtilization >= 70 ? 'text-brand-teal' : 'text-brand-amber'}
        />
      </div>
      {Object.keys(m.perGoalPassRate).length > 0 && (
        <div className="border-t border-foreground/5 pt-3 space-y-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Per-Goal Achievement</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(m.perGoalPassRate).map(([ruleId, rate]) => (
              <span key={ruleId} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rate >= 70 ? 'border-brand-teal/30 text-brand-teal bg-brand-teal/5' : 'border-brand-amber/30 text-brand-amber bg-brand-amber/5'}`}>
                {ruleId.replace(/_/g, ' ')}: {rate.toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SharedMetrics({ m, isProjected }: { m: SharedCohortMetrics; isProjected: boolean }) {
  const savingsColor = m.grossSavings >= 0 ? 'text-brand-teal' : 'text-brand-amber';
  const netColor = m.providerNet >= 0 ? 'text-brand-teal' : 'text-brand-amber';
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <FinancialCol label="Total Benchmark" value={fmtChf(m.totalBenchmark)} sub="Risk-adj. targets" />
      <FinancialCol label="Total Cost" value={fmtChf(m.totalCost)} sub={isProjected ? 'Projected' : 'Settled'} />
      <FinancialCol label="Gross Savings" value={fmtChf(m.grossSavings)} sub="Benchmark − cost" accent={savingsColor} />
      <FinancialCol label="Provider Net" value={fmtChf(m.providerNet)} sub={`${m.gateEligibleCount}/${m.count} gate-eligible`} accent={netColor} />
    </div>
  );
}

function BundledMetrics({ m, isProjected }: { m: BundledCohortMetrics; isProjected: boolean }) {
  const netColor = m.netMargin >= 0 ? 'text-brand-teal' : 'text-brand-amber';
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <FinancialCol label="Bundle Revenue" value={fmtChf(m.totalBundleRevenue)} sub={`${m.count} episodes`} />
      <FinancialCol label="Total Cost" value={fmtChf(m.totalCost)} sub={isProjected ? 'Projected' : 'Settled'} />
      <FinancialCol label="Net Margin" value={fmtChf(m.netMargin)} sub={`${m.profitableCount} profitable`} accent={netColor} />
      <FinancialCol label="Gate Failures" value={`${m.gateFailureCount}`} sub={`${m.lossMakingCount} loss-making`} accent={m.gateFailureCount > 0 ? 'text-brand-amber' : 'text-muted-foreground'} />
    </div>
  );
}

function CapitationMetrics({ m, isProjected }: { m: CapitationCohortMetrics; isProjected: boolean }) {
  const netColor = m.netMargin >= 0 ? 'text-brand-teal' : 'text-brand-amber';
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <FinancialCol label="Total Revenue" value={fmtChf(m.totalRevenue)} sub={`${m.count} patients`} />
      <FinancialCol label="Total Cost" value={fmtChf(m.totalCost)} sub={isProjected ? 'Projected' : 'Settled'} />
      <FinancialCol label="Net Margin" value={fmtChf(m.netMargin)} sub={`avg ${fmtChf(m.avgPerPatientMargin)}/pt`} accent={netColor} />
      <FinancialCol label="Loss-making" value={`${m.marginNegativeCount}`} sub="patients in deficit" accent={m.marginNegativeCount > 0 ? 'text-brand-amber' : 'text-muted-foreground'} />
    </div>
  );
}

function CohortMetricsBlock({
  report,
  cohort,
  isFinal,
}: {
  report: ContractReport;
  cohort: 'completed' | 'active';
  isFinal: boolean;
}) {
  const data = cohort === 'completed' ? report.completed : report.active;
  const m = data.metrics;
  const isProjected = !isFinal;

  return (
    <div className="flex-1 min-w-0 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {isFinal ? 'Completed Cohort' : 'Active Cohort'}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFinal ? 'bg-brand-teal/15 text-brand-teal' : 'bg-brand-amber/15 text-brand-amber'}`}>
          {isFinal ? 'Final / Settled' : 'Projected'}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground font-semibold">{m.count} patients</p>
      {report.contractType === 'p4p' && <P4PMetrics m={m as P4PCohortMetrics} isProjected={isProjected} />}
      {report.contractType === 'shared' && <SharedMetrics m={m as SharedCohortMetrics} isProjected={isProjected} />}
      {report.contractType === 'bundled' && <BundledMetrics m={m as BundledCohortMetrics} isProjected={isProjected} />}
      {report.contractType === 'capitation' && <CapitationMetrics m={m as CapitationCohortMetrics} isProjected={isProjected} />}
    </div>
  );
}

// Maps settlement action text to contract type
function settlementText(report: ContractReport, isFinal: boolean): { pass: string; fail: string } {
  const m = (isFinal ? report.completed : report.active).metrics;
  switch (report.contractType) {
    case 'p4p': {
      const p = m as P4PCohortMetrics;
      return {
        pass: `➔ Total Payout: ${fmtChf(p.totalPayout)} (${p.bonusPoolUtilization.toFixed(0)}% bonus utilized)`,
        fail: `➔ Bonus Pool Remaining: ${fmtChf(p.bonusPoolTotal - p.totalBonusEarned)}`,
      };
    }
    case 'shared': {
      const s = m as SharedCohortMetrics;
      return {
        pass: `➔ Provider Net: ${fmtChf(s.providerNet)} (${s.gateEligibleCount} gate-eligible)`,
        fail: `➔ Gross Savings: ${fmtChf(s.grossSavings)} vs benchmark`,
      };
    }
    case 'bundled': {
      const b = m as BundledCohortMetrics;
      return {
        pass: `➔ Net Margin: ${fmtChf(b.netMargin)} (${b.profitableCount} profitable episodes)`,
        fail: `➔ Gate Failures: ${b.gateFailureCount} / Loss-making: ${b.lossMakingCount}`,
      };
    }
    case 'capitation': {
      const c = m as CapitationCohortMetrics;
      return {
        pass: `➔ Net Margin: ${fmtChf(c.netMargin)} (avg ${fmtChf(c.avgPerPatientMargin)}/patient)`,
        fail: `➔ Loss-making Patients: ${c.marginNegativeCount}`,
      };
    }
  }
}

const CONTRACT_NAMES: Record<string, string> = {
  p4p: 'Pay-for-Performance (P4P)',
  shared: 'Shared Savings / Shared Risk',
  bundled: 'Bundled Payments',
  capitation: 'Capitation',
};

export default function Dashboard() {
  const { patients, thresholds, isLoading, contractType, contractParams } = useData();

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const { completed, active } = useMemo(() => partitionByStatus(patients, asOf), [patients, asOf]);

  const summary       = useMemo(() => getCohortSummary(completed, thresholds), [completed, thresholds]);
  const activeSummary = useMemo(() => getCohortSummary(active, thresholds), [active, thresholds]);
  const rulePerf      = useMemo(() => getRulePerformance(completed, thresholds), [completed, thresholds]);
  const classified    = useMemo(() => classifyCohort(patients, thresholds, asOf), [patients, thresholds, asOf]);
  const cats          = useMemo(() => getByCategory(classified), [classified]);

  // Parse contract and compute report
  const contract = useMemo(() => {
    if (!contractType) return null;
    return parseContract(contractType, contractParams, thresholds);
  }, [contractType, contractParams, thresholds]);

  const report = useMemo(() => {
    if (!contract) return null;
    return computeContractReport(patients, contract, thresholds);
  }, [patients, contract, thresholds]);

  // Search states
  const [needsReviewSearch, setNeedsReviewSearch] = useState('');
  const [flaggedSearch, setFlaggedSearch] = useState('');
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Assembling dashboard metrics…</p>
        </div>
      </div>
    );
  }

  const enabledRules = thresholds.rules.filter(r => r.enabled);
  const failRate = 100 - summary.passRate;
  const onTrackRate = active.length > 0 ? (cats.onTrack.length / active.length) * 100 : 0;
  const flaggedRate = 100 - onTrackRate;

  // Real classified patients for detail lists
  const filteredNeedsReview = cats.fail.filter(c =>
    c.patient.patient_id.toLowerCase().includes(needsReviewSearch.toLowerCase()) ||
    c.unmetTargetLabels.some(label => label.toLowerCase().includes(needsReviewSearch.toLowerCase()))
  );

  const filteredFlagged = cats.flagged
    .slice()
    .sort((a, b) => (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999))
    .filter(c =>
      c.patient.patient_id.toLowerCase().includes(flaggedSearch.toLowerCase()) ||
      c.unmetTargetLabels.some(label => label.toLowerCase().includes(flaggedSearch.toLowerCase()))
    );

  const completedSettlement = report ? settlementText(report, true) : null;

  return (
    <div id="overview-section" className="space-y-10 scroll-mt-48">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight">Outcome Dashboard</h1>
      </div>

      {/* Overview section title */}
      <SectionHeader title="Overview" count={patients.length} icon={LayoutDashboard} accent="border-brand-teal" />

      {/* ── Active Contract Summary ─────────────────────────────────────────── */}
      <div className="bg-background/80 border border-brand-teal/30 rounded-2xl p-8 shadow-md glass-panel">
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-brand-teal animate-pulse" />
              <h2 className="text-xl font-black tracking-tight">Active Contract Summary</h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Real-world evidence capture and smart contract audit for {patients.length} total participants.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Completed group */}
            <div className="flex-1 space-y-3 md:border-r border-foreground/8 md:pr-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Completed Patients</span>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider block">Total</span>
                  <span className="text-3xl font-black text-foreground">{completed.length}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider block">Verified</span>
                  <span className="text-3xl font-black text-brand-teal">{summary.passed}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider block">Forfeited</span>
                  <span className="text-3xl font-black text-brand-amber">{summary.failed}</span>
                </div>
              </div>
            </div>
            {/* Active group */}
            <div className="flex-1 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Active Patients</span>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider block">Total</span>
                  <span className="text-3xl font-black text-foreground">{active.length}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider block">On Track</span>
                  <span className="text-3xl font-black text-brand-teal">{cats.onTrack.length}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider block">Flagged</span>
                  <span className="text-3xl font-black text-brand-amber">{cats.flagged.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contract & Financial Metrics ─────────────────────────────────────── */}
      <div className="bg-background/80 border border-brand-teal/40 rounded-2xl p-6 shadow-md relative overflow-hidden group glass-panel">
        <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
          <ShieldAlert className="size-36 text-brand-teal" />
        </div>
        <div className="space-y-5 z-10 relative">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-brand-teal animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Contract & Financial Metrics</h2>
            {contractType && (
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                {CONTRACT_NAMES[contractType] ?? contractType}
              </span>
            )}
          </div>

          {!report ? (
            <p className="text-sm text-muted-foreground font-medium">
              No payment contract configured. Complete the payment agreement step to see financial reporting here.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Two cohort blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => scrollToId('completion-section', true)}
                  className="text-left rounded-xl border border-brand-teal/20 bg-brand-teal/4 hover:bg-brand-teal/8 hover:border-brand-teal/35 transition-all p-5 group/card"
                >
                  <CohortMetricsBlock report={report} cohort="completed" isFinal={true} />
                  <p className="text-[10px] font-bold text-brand-teal mt-4 group-hover/card:underline">
                    View completed patients →
                  </p>
                </button>
                <button
                  onClick={() => scrollToId('ongoing-section', true)}
                  className="text-left rounded-xl border border-brand-amber/20 bg-brand-amber/4 hover:bg-brand-amber/8 hover:border-brand-amber/35 transition-all p-5 group/card"
                >
                  <CohortMetricsBlock report={report} cohort="active" isFinal={false} />
                  <p className="text-[10px] font-bold text-brand-amber mt-4 group-hover/card:underline">
                    View ongoing patients →
                  </p>
                </button>
              </div>

              {/* Combined totals */}
              <div className="rounded-xl border border-foreground/8 bg-background/60 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-foreground/8" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Combined — All {patients.length} Patients</span>
                  <div className="h-px flex-1 bg-foreground/8" />
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {report.contractType === 'p4p' && (() => {
                    const m = report.combined.metrics as P4PCohortMetrics;
                    return (
                      <>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Total Payout</span>
                          <span className="text-lg font-black text-foreground">{fmtChf(m.totalPayout)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Guarantee</span>
                          <span className="text-lg font-black text-brand-teal">{fmtChf(m.totalGuarantee)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Bonus Earned</span>
                          <span className="text-lg font-black text-brand-teal">{fmtChf(m.totalBonusEarned)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Bonus Utilization</span>
                          <span className="text-lg font-black text-foreground">{m.bonusPoolUtilization.toFixed(1)}%</span>
                        </div>
                      </>
                    );
                  })()}
                  {report.contractType === 'shared' && (() => {
                    const m = report.combined.metrics as SharedCohortMetrics;
                    return (
                      <>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Total Benchmark</span>
                          <span className="text-lg font-black text-foreground">{fmtChf(m.totalBenchmark)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Total Cost</span>
                          <span className="text-lg font-black text-foreground">{fmtChf(m.totalCost)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Gross Savings</span>
                          <span className={`text-lg font-black ${m.grossSavings >= 0 ? 'text-brand-teal' : 'text-brand-amber'}`}>{fmtChf(m.grossSavings)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Provider Net</span>
                          <span className={`text-lg font-black ${m.providerNet >= 0 ? 'text-brand-teal' : 'text-brand-amber'}`}>{fmtChf(m.providerNet)}</span>
                        </div>
                      </>
                    );
                  })()}
                  {report.contractType === 'bundled' && (() => {
                    const m = report.combined.metrics as BundledCohortMetrics;
                    return (
                      <>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Bundle Revenue</span>
                          <span className="text-lg font-black text-foreground">{fmtChf(m.totalBundleRevenue)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Total Cost</span>
                          <span className="text-lg font-black text-foreground">{fmtChf(m.totalCost)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Net Margin</span>
                          <span className={`text-lg font-black ${m.netMargin >= 0 ? 'text-brand-teal' : 'text-brand-amber'}`}>{fmtChf(m.netMargin)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Gate Failures</span>
                          <span className="text-lg font-black text-brand-amber">{m.gateFailureCount}</span>
                        </div>
                      </>
                    );
                  })()}
                  {report.contractType === 'capitation' && (() => {
                    const m = report.combined.metrics as CapitationCohortMetrics;
                    return (
                      <>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Total Revenue</span>
                          <span className="text-lg font-black text-foreground">{fmtChf(m.totalRevenue)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Total Cost</span>
                          <span className="text-lg font-black text-foreground">{fmtChf(m.totalCost)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Net Margin</span>
                          <span className={`text-lg font-black ${m.netMargin >= 0 ? 'text-brand-teal' : 'text-brand-amber'}`}>{fmtChf(m.netMargin)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Avg / Patient</span>
                          <span className={`text-lg font-black ${m.avgPerPatientMargin >= 0 ? 'text-brand-teal' : 'text-brand-amber'}`}>{fmtChf(m.avgPerPatientMargin)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPLETED ────────────────────────────────────────────────────────── */}
      <div id="completion-section" className="space-y-6 scroll-mt-48 pt-10 mt-4">
        <div className="h-px bg-gradient-to-r from-brand-teal/50 via-brand-teal/15 to-transparent mb-2" />
        <SectionHeader title="Completed" count={completed.length} icon={CheckCircle2} accent="border-brand-teal" />

        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patients have completed treatment yet.</p>
        ) : (
          <>
            <StatTiles
              count={completed.length}
              rateLabel="Audit Pass Rate"
              rateValue={summary.passRate}
              hba1c={summary.avgHba1cChange}
              cgm={summary.avgCgmTimeInRange}
              weight={summary.avgWeightLossPct}
            />

            {/* Goal Success Rates */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Goal Success Rates</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Share of completed patients meeting each clinical threshold.</p>
                {rulePerf.length > 0 && (
                  <p className="text-[10px] text-muted-foreground italic font-semibold mt-1">
                    Underperformance in any benchmark directly triggers forfeiture of the performance escrow.
                  </p>
                )}
              </div>
              <div className={`grid gap-5 ${rulePerf.length <= 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {(() => {
                  const worstIdx = rulePerf.length > 0
                    ? rulePerf.indexOf(rulePerf.reduce((min, r) => r.passRate < min.passRate ? r : min))
                    : -1;
                  return rulePerf.map((rule, idx) => (
                    <GoalMetricCard
                      key={rule.ruleId}
                      label={rule.label}
                      passRate={rule.passRate}
                      isPrimary={idx === worstIdx && rule.passRate < 70}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* Settlement Audit */}
            <Card id="outcome-breakdown" className="shadow-md bg-background/50 border-foreground/5 rounded-2xl glass-panel hover-glass-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">Settlement Audit: Verified Payout vs Forfeited Capital</CardTitle>
                  <CardDescription className="text-xs">
                    Pass vs Fail across {enabledRules.length} targets mapping to escrow release conditions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    <div className="shrink-0">
                      <ProgressRing value={summary.passRate} color={summary.passRate >= 70 ? '#55B4A6' : '#E9A23B'} />
                    </div>
                    <div className="flex-1 w-full space-y-4">
                      <div className="flex flex-col gap-1 border-b border-muted-foreground/5 pb-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full bg-brand-teal glow-teal-sm" />
                            <span className="font-bold text-foreground">Verified Payout (Goals Met)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-foreground">{summary.passed} Patients</span>
                            <span className="text-[10px] text-brand-teal font-bold ml-1.5">({summary.passRate.toFixed(1)}%)</span>
                          </div>
                        </div>
                        {completedSettlement && (
                          <div className="text-[10px] text-brand-teal font-bold leading-relaxed border-t border-brand-teal/15 pt-1.5 mt-1.5">
                            <span className="text-muted-foreground font-semibold uppercase text-[8px] tracking-wider block mb-0.5">Settlement Action</span>
                            <span className="font-black text-xs block text-foreground">{completedSettlement.pass}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full bg-brand-amber" />
                            <span className="font-bold text-foreground">Forfeited Capital (Goals Unmet)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-foreground">{summary.failed} Patients</span>
                            <span className="text-[10px] text-brand-amber font-bold ml-1.5">({failRate.toFixed(1)}%)</span>
                          </div>
                        </div>
                        {completedSettlement && (
                          <div className="text-[10px] text-brand-amber font-bold leading-relaxed border-t border-brand-amber/15 pt-1.5 mt-1.5">
                            <span className="text-muted-foreground font-semibold uppercase text-[8px] tracking-wider block mb-0.5">Settlement Action</span>
                            <span className="font-black text-xs block text-foreground">{completedSettlement.fail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-muted-foreground/10 pt-3 w-full text-center mt-6">
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      <span className="font-bold text-foreground/80">Audit Criteria:</span>{' '}
                      {thresholds.passPolicy === 'all'
                        ? `all ${enabledRules.length} outcome targets required`
                        : thresholds.passPolicy === 'any'
                        ? 'any 1 rule required'
                        : `≥ ${thresholds.minRulesToPass ?? 1} targets required`}
                    </p>
                  </div>
                </CardContent>
            </Card>

            {/* Needs review: failed completed patients */}
            <Card className="shadow-md bg-background/50 border-foreground/5 rounded-2xl glass-panel">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5 text-brand-amber">
                    <AlertTriangle className="size-4" />
                    Needs Review
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Completed patients who did not meet all checked targets at the end of their program.
                  </CardDescription>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Patient ID..."
                    value={needsReviewSearch}
                    onChange={(e) => setNeedsReviewSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all font-semibold"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredNeedsReview.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 font-semibold">
                    {cats.fail.length === 0 ? 'All completed patients met their targets.' : 'No patients match filters.'}
                  </p>
                ) : (
                  <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1">
                    {filteredNeedsReview.map((c) => (
                      <PatientRow
                        key={c.patient.patient_id}
                        patient={c.patient}
                        evaluation={c.evaluation}
                        isOpen={expandedPatientId === c.patient.patient_id}
                        onToggle={() => setExpandedPatientId(prev => prev === c.patient.patient_id ? null : c.patient.patient_id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── ONGOING ──────────────────────────────────────────────────────────── */}
      <div id="ongoing-section" className="space-y-6 scroll-mt-48 pt-10 mt-4">
        <div className="h-px bg-gradient-to-r from-brand-amber/50 via-brand-amber/15 to-transparent mb-2" />
        <SectionHeader title="Ongoing" count={active.length} icon={Activity} accent="border-brand-amber" />

        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patients currently in treatment.</p>
        ) : (
          <>
            <StatTiles
              count={active.length}
              rateLabel="On-Track Rate"
              rateValue={onTrackRate}
              hba1c={activeSummary.avgHba1cChange}
              cgm={activeSummary.avgCgmTimeInRange}
              weight={activeSummary.avgWeightLossPct}
            />

            {/* On-track vs flagged breakdown */}
            <div className="space-y-6">
              <Card className="shadow-md bg-background/50 border-foreground/5 rounded-2xl glass-panel hover-glass-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">Ongoing Target Breakdown</CardTitle>
                  <CardDescription className="text-xs">
                    "On track" patients are currently meeting all targets; "Flagged" patients represent capital at risk.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    <div className="shrink-0">
                      <ProgressRing value={onTrackRate} color={onTrackRate >= 70 ? '#55B4A6' : '#E9A23B'} />
                    </div>
                    <div className="flex-1 w-full space-y-4">
                      <div className="flex items-center justify-between text-sm border-b border-muted-foreground/5 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="size-2.5 rounded-full bg-brand-teal glow-teal-sm" />
                          <span className="font-bold text-foreground">On Track (Low Risk)</span>
                        </div>
                        <div className="text-right font-black">
                          {cats.onTrack.length} <span className="text-[10px] text-muted-foreground">({onTrackRate.toFixed(1)}%)</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full bg-brand-amber" />
                            <span className="font-bold text-foreground">Flagged (Capital at Risk)</span>
                          </div>
                          <div className="text-right font-black">
                            {cats.flagged.length} <span className="text-[10px] text-brand-amber">({flaggedRate.toFixed(1)}%)</span>
                          </div>
                        </div>
                        {report && (() => {
                          const activeM = report.active.metrics;
                          const riskSummary = report.contractType === 'p4p'
                            ? `${fmtChf((activeM as P4PCohortMetrics).bonusPoolTotal - (activeM as P4PCohortMetrics).totalBonusEarned)} bonus at risk`
                            : report.contractType === 'shared'
                            ? `${fmtChf(Math.abs(Math.min((activeM as SharedCohortMetrics).providerNet, 0)))} exposure`
                            : report.contractType === 'bundled'
                            ? `${(activeM as BundledCohortMetrics).lossMakingCount} loss-making episodes`
                            : `${(activeM as CapitationCohortMetrics).marginNegativeCount} deficit patients`;
                          return (
                            <div className="text-[10px] text-brand-amber font-bold leading-relaxed border-t border-brand-amber/15 pt-1.5 mt-1.5">
                              <span className="text-muted-foreground font-semibold uppercase text-[8px] tracking-wider block mb-0.5">Exposure Summary</span>
                              <span className="block">{cats.flagged.length} Patients Off-Track</span>
                              <span className="block text-xs mt-0.5 text-foreground font-black">➔ {riskSummary}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground border-t border-muted-foreground/10 pt-3 w-full text-center font-semibold mt-6">
                    "On track" = currently meeting all checked targets. Financial figures are projections only.
                  </p>
                </CardContent>
              </Card>

              {/* Flagged active patients — sorted nearest completion first */}
              <Card className="shadow-md bg-background/50 border-foreground/5 rounded-2xl glass-panel">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5 text-brand-amber">
                      <ShieldAlert className="size-4 animate-pulse" />
                      Active Capital at Risk
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Active patients not yet meeting one or more outcome targets. Costs are projected to full episode.
                    </CardDescription>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Patient ID..."
                      value={flaggedSearch}
                      onChange={(e) => setFlaggedSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all font-semibold"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredFlagged.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 font-semibold">
                      {cats.flagged.length === 0 ? 'All active patients are on track.' : 'No flagged patients match filters.'}
                    </p>
                  ) : (
                    <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1">
                      {filteredFlagged.map((c) => (
                        <PatientRow
                          key={c.patient.patient_id}
                          patient={c.patient}
                          evaluation={c.evaluation}
                          daysRemaining={c.daysRemaining}
                          isOpen={expandedPatientId === c.patient.patient_id}
                          onToggle={() => setExpandedPatientId(prev => prev === c.patient.patient_id ? null : c.patient.patient_id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
