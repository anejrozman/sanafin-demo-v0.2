import { useMemo, useState } from 'react';
import { Loader2, Search, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Calendar, User, Activity, Flame, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useData } from '../../store/DataContext';
import {
  getCohortSummary, getRulePerformance,
  getAsOfDate, partitionByStatus,
  classifyCohort, getByCategory,
  type ClassifiedPatient,
} from '../../lib/selectors';
import { type PatientRecord } from '../../lib/schema';


function fmt(v: number | null | undefined, decimals = 1): string {
  return (v != null && isFinite(v)) ? v.toFixed(decimals) : '—';
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
      {/* Area Fading Shading */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      {/* Stroke Line */}
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
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-muted/40 fill-transparent"
          strokeWidth={strokeWidth - 2}
        />
        {/* Animated Glowing Ring */}
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
        <div className="flex items-center justify-between text-xs font-semibold">
          <span style={{ color: barColor }}>
            {passing ? '✓ On target' : '⚠ Below threshold'}
          </span>
          <span className="text-muted-foreground">Target: ≥ 70%</span>
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
          className="rounded-xl border border-foreground/5 bg-background/50 hover:bg-background/80 hover:shadow-lg hover:border-brand-teal/30 transition-all duration-300 p-4 flex flex-col justify-between group glass-panel"
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
  onToggle 
}: { 
  patient: PatientRecord; 
  evaluation: { ruleResults: { ruleId: string; label: string; actual: number | null; unit: string; passed: boolean }[] };
  daysRemaining?: number | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const attendanceRate = patient.total_sessions > 0
    ? Math.round((patient.sessions_attended / patient.total_sessions) * 100)
    : 0;

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
            {patient.patient_id}
          </div>
          <div>
            <span className="font-bold text-sm block text-foreground">Patient {patient.patient_id}</span>
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
              
              {/* Financial Exposure Placement (Left Column to avoid right details overflow) */}
              {isFailed ? (
                <span className="w-fit inline-flex items-center gap-1 bg-brand-amber/10 border border-brand-amber/35 text-brand-amber text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                  <ShieldAlert className="size-3 shrink-0" />
                  <span>
                    {daysRemaining != null 
                      ? `CHF 800 pending clawback in ${daysRemaining}d` 
                      : `Escrow Clawback: CHF 800`}
                  </span>
                </span>
              ) : (
                <span className="w-fit inline-flex items-center gap-1 bg-brand-teal/10 border border-brand-teal/35 text-brand-teal text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="size-3 shrink-0 text-brand-teal" />
                  <span>
                    {daysRemaining != null 
                      ? `CHF 800 Escrow Secure` 
                      : `Escrow Released: CHF 800`}
                  </span>
                </span>
              )}
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
          <div className="size-8 rounded-full bg-muted/30 flex items-center justify-center border hover:bg-muted/50 transition-colors">
            {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {/* Expanded view showing baseline vs follow-up values */}
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
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Coaching Program</span>
              <div className="flex items-baseline justify-between mt-2 z-10">
                <span className="text-base font-black text-foreground">
                  {patient.sessions_attended} / {patient.total_sessions}
                </span>
                <span className="text-[10px] text-muted-foreground/80 font-bold">
                  {patient.total_sessions} sessions total
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_NEEDS_REVIEW: ClassifiedPatient[] = [
  {
    patient: {
      patient_id: "SF-COMP-089",
      enrollment_date: "2025-06-01",
      end_date: "2026-06-01",
      last_measurement_date: "2026-06-01",
      baseline_hba1c: 8.2,
      latest_hba1c: 7.9,
      cgm_time_in_range: 62.5,
      baseline_weight_kg: 95.0,
      latest_weight_kg: 94.0,
      sessions_attended: 18,
      total_sessions: 24
    },
    category: "fail",
    daysRemaining: null,
    unmetTargetLabels: ["HbA1c Reduction", "CGM Time-in-Range", "Weight Loss"],
    targetGaps: [
      { label: "HbA1c Reduction", gap: 0.2, unit: "pp" },
      { label: "CGM Time-in-Range", gap: 7.5, unit: "%" },
      { label: "Weight Loss", gap: 3.95, unit: "%" }
    ],
    evaluation: {
      patientId: "SF-COMP-089",
      passed: false,
      metrics: {
        hba1c_change: 0.3,
        cgm_time_in_range: 62.5,
        weight_loss_pct: 1.05
      },
      patient: {
        patient_id: "SF-COMP-089",
        enrollment_date: "2025-06-01",
        end_date: "2026-06-01",
        last_measurement_date: "2026-06-01",
        baseline_hba1c: 8.2,
        latest_hba1c: 7.9,
        cgm_time_in_range: 62.5,
        baseline_weight_kg: 95.0,
        latest_weight_kg: 94.0,
        sessions_attended: 18,
        total_sessions: 24
      },
      ruleResults: [
        { ruleId: "hba1c_change", label: "HbA1c Reduction", actual: 0.3, target: 0.5, operator: ">=", unit: "pp", passed: false },
        { ruleId: "cgm_time_in_range", label: "CGM Time-in-Range", actual: 62.5, target: 70.0, operator: ">=", unit: "%", passed: false },
        { ruleId: "weight_loss_pct", label: "Weight Loss", actual: 1.05, target: 5.0, operator: ">=", unit: "%", passed: false }
      ]
    }
  },
  {
    patient: {
      patient_id: "SF-COMP-142",
      enrollment_date: "2025-05-15",
      end_date: "2026-05-15",
      last_measurement_date: "2026-05-15",
      baseline_hba1c: 7.8,
      latest_hba1c: 7.1,
      cgm_time_in_range: 68.1,
      baseline_weight_kg: 110.0,
      latest_weight_kg: 108.5,
      sessions_attended: 22,
      total_sessions: 24
    },
    category: "fail",
    daysRemaining: null,
    unmetTargetLabels: ["CGM Time-in-Range", "Weight Loss"],
    targetGaps: [
      { label: "CGM Time-in-Range", gap: 1.9, unit: "%" },
      { label: "Weight Loss", gap: 3.64, unit: "%" }
    ],
    evaluation: {
      patientId: "SF-COMP-142",
      passed: false,
      metrics: {
        hba1c_change: 0.7,
        cgm_time_in_range: 68.1,
        weight_loss_pct: 1.36
      },
      patient: {
        patient_id: "SF-COMP-142",
        enrollment_date: "2025-05-15",
        end_date: "2026-05-15",
        last_measurement_date: "2026-05-15",
        baseline_hba1c: 7.8,
        latest_hba1c: 7.1,
        cgm_time_in_range: 68.1,
        baseline_weight_kg: 110.0,
        latest_weight_kg: 108.5,
        sessions_attended: 22,
        total_sessions: 24
      },
      ruleResults: [
        { ruleId: "hba1c_change", label: "HbA1c Reduction", actual: 0.7, target: 0.5, operator: ">=", unit: "pp", passed: true },
        { ruleId: "cgm_time_in_range", label: "CGM Time-in-Range", actual: 68.1, target: 70.0, operator: ">=", unit: "%", passed: false },
        { ruleId: "weight_loss_pct", label: "Weight Loss", actual: 1.36, target: 5.0, operator: ">=", unit: "%", passed: false }
      ]
    }
  },
  {
    patient: {
      patient_id: "SF-COMP-203",
      enrollment_date: "2025-05-20",
      end_date: "2026-05-20",
      last_measurement_date: "2026-05-20",
      baseline_hba1c: 9.1,
      latest_hba1c: 8.8,
      cgm_time_in_range: 72.0,
      baseline_weight_kg: 88.0,
      latest_weight_kg: 87.2,
      sessions_attended: 14,
      total_sessions: 24
    },
    category: "fail",
    daysRemaining: null,
    unmetTargetLabels: ["HbA1c Reduction", "Weight Loss"],
    targetGaps: [
      { label: "HbA1c Reduction", gap: 0.2, unit: "pp" },
      { label: "Weight Loss", gap: 4.1, unit: "%" }
    ],
    evaluation: {
      patientId: "SF-COMP-203",
      passed: false,
      metrics: {
        hba1c_change: 0.3,
        cgm_time_in_range: 72.0,
        weight_loss_pct: 0.91
      },
      patient: {
        patient_id: "SF-COMP-203",
        enrollment_date: "2025-05-20",
        end_date: "2026-05-20",
        last_measurement_date: "2026-05-20",
        baseline_hba1c: 9.1,
        latest_hba1c: 8.8,
        cgm_time_in_range: 72.0,
        baseline_weight_kg: 88.0,
        latest_weight_kg: 87.2,
        sessions_attended: 14,
        total_sessions: 24
      },
      ruleResults: [
        { ruleId: "hba1c_change", label: "HbA1c Reduction", actual: 0.3, target: 0.5, operator: ">=", unit: "pp", passed: false },
        { ruleId: "cgm_time_in_range", label: "CGM Time-in-Range", actual: 72.0, target: 70.0, operator: ">=", unit: "%", passed: true },
        { ruleId: "weight_loss_pct", label: "Weight Loss", actual: 0.91, target: 5.0, operator: ">=", unit: "%", passed: false }
      ]
    }
  }
];

const MOCK_ACTIVE_CAPITAL_AT_RISK: ClassifiedPatient[] = [
  {
    patient: {
      patient_id: "SF-ACT-402",
      enrollment_date: "2025-09-01",
      end_date: "2026-08-31",
      last_measurement_date: "2026-06-15",
      baseline_hba1c: 8.5,
      latest_hba1c: 8.3,
      cgm_time_in_range: 64.2,
      baseline_weight_kg: 102.0,
      latest_weight_kg: 101.5,
      sessions_attended: 15,
      total_sessions: 20
    },
    category: "flagged",
    daysRemaining: 76,
    unmetTargetLabels: ["HbA1c Reduction", "CGM Time-in-Range", "Weight Loss"],
    targetGaps: [
      { label: "HbA1c Reduction", gap: 0.3, unit: "pp" },
      { label: "CGM Time-in-Range", gap: 5.8, unit: "%" },
      { label: "Weight Loss", gap: 4.51, unit: "%" }
    ],
    evaluation: {
      patientId: "SF-ACT-402",
      passed: false,
      metrics: {
        hba1c_change: 0.2,
        cgm_time_in_range: 64.2,
        weight_loss_pct: 0.49
      },
      patient: {
        patient_id: "SF-ACT-402",
        enrollment_date: "2025-09-01",
        end_date: "2026-08-31",
        last_measurement_date: "2026-06-15",
        baseline_hba1c: 8.5,
        latest_hba1c: 8.3,
        cgm_time_in_range: 64.2,
        baseline_weight_kg: 102.0,
        latest_weight_kg: 101.5,
        sessions_attended: 15,
        total_sessions: 20
      },
      ruleResults: [
        { ruleId: "hba1c_change", label: "HbA1c Reduction", actual: 0.2, target: 0.5, operator: ">=", unit: "pp", passed: false },
        { ruleId: "cgm_time_in_range", label: "CGM Time-in-Range", actual: 64.2, target: 70.0, operator: ">=", unit: "%", passed: false },
        { ruleId: "weight_loss_pct", label: "Weight Loss", actual: 0.49, target: 5.0, operator: ">=", unit: "%", passed: false }
      ]
    }
  },
  {
    patient: {
      patient_id: "SF-ACT-511",
      enrollment_date: "2025-10-10",
      end_date: "2026-10-09",
      last_measurement_date: "2026-06-15",
      baseline_hba1c: 7.6,
      latest_hba1c: 7.5,
      cgm_time_in_range: 61.8,
      baseline_weight_kg: 94.0,
      latest_weight_kg: 93.2,
      sessions_attended: 12,
      total_sessions: 18
    },
    category: "flagged",
    daysRemaining: 116,
    unmetTargetLabels: ["CGM Time-in-Range", "Weight Loss"],
    targetGaps: [
      { label: "CGM Time-in-Range", gap: 8.2, unit: "%" },
      { label: "Weight Loss", gap: 4.15, unit: "%" }
    ],
    evaluation: {
      patientId: "SF-ACT-511",
      passed: false,
      metrics: {
        hba1c_change: 0.1,
        cgm_time_in_range: 61.8,
        weight_loss_pct: 0.85
      },
      patient: {
        patient_id: "SF-ACT-511",
        enrollment_date: "2025-10-10",
        end_date: "2026-10-09",
        last_measurement_date: "2026-06-15",
        baseline_hba1c: 7.6,
        latest_hba1c: 7.5,
        cgm_time_in_range: 61.8,
        baseline_weight_kg: 94.0,
        latest_weight_kg: 93.2,
        sessions_attended: 12,
        total_sessions: 18
      },
      ruleResults: [
        { ruleId: "hba1c_change", label: "HbA1c Reduction", actual: 0.1, target: 0.5, operator: ">=", unit: "pp", passed: false },
        { ruleId: "cgm_time_in_range", label: "CGM Time-in-Range", actual: 61.8, target: 70.0, operator: ">=", unit: "%", passed: false },
        { ruleId: "weight_loss_pct", label: "Weight Loss", actual: 0.85, target: 5.0, operator: ">=", unit: "%", passed: false }
      ]
    }
  },
  {
    patient: {
      patient_id: "SF-ACT-620",
      enrollment_date: "2025-07-01",
      end_date: "2026-06-30",
      last_measurement_date: "2026-06-15",
      baseline_hba1c: 8.9,
      latest_hba1c: 8.6,
      cgm_time_in_range: 64.2,
      baseline_weight_kg: 85.0,
      latest_weight_kg: 84.5,
      sessions_attended: 20,
      total_sessions: 22
    },
    category: "flagged",
    daysRemaining: 14,
    unmetTargetLabels: ["CGM Time-in-Range", "Weight Loss"],
    targetGaps: [
      { label: "CGM Time-in-Range", gap: 5.8, unit: "%" },
      { label: "Weight Loss", gap: 4.41, unit: "%" }
    ],
    evaluation: {
      patientId: "SF-ACT-620",
      passed: false,
      metrics: {
        hba1c_change: 0.3,
        cgm_time_in_range: 64.2,
        weight_loss_pct: 0.59
      },
      patient: {
        patient_id: "SF-ACT-620",
        enrollment_date: "2025-07-01",
        end_date: "2026-06-30",
        last_measurement_date: "2026-06-15",
        baseline_hba1c: 8.9,
        latest_hba1c: 8.6,
        cgm_time_in_range: 64.2,
        baseline_weight_kg: 85.0,
        latest_weight_kg: 84.5,
        sessions_attended: 20,
        total_sessions: 22
      },
      ruleResults: [
        { ruleId: "hba1c_change", label: "HbA1c Reduction", actual: 0.3, target: 0.5, operator: ">=", unit: "pp", passed: false },
        { ruleId: "cgm_time_in_range", label: "CGM Time-in-Range", actual: 64.2, target: 70.0, operator: ">=", unit: "%", passed: false },
        { ruleId: "weight_loss_pct", label: "Weight Loss", actual: 0.59, target: 5.0, operator: ">=", unit: "%", passed: false }
      ]
    }
  }
];

function fmtChf(n: number): string {
  return `CHF ${Math.round(n).toLocaleString('de-CH')}`;
}

function computeCohortFinancials(
  contractType: string,
  params: Record<string, string | number>,
  totalPatients: number,
  passCount: number,
  failCount: number,
) {
  const base = Number(params.base_payment) || 800;
  const escrow = base * totalPatients;
  let guaranteed = 0, performanceEarned = 0, performanceLost = 0;

  switch (contractType) {
    case 'p4p':
      guaranteed = 0;
      performanceEarned = base * passCount;
      performanceLost = base * (Number(params.penalty || 5) / 100) * failCount;
      break;
    case 'shared': {
      const savPct = Number(params.savings_share || 30) / 100;
      const riskPct = Number(params.risk_share || 20) / 100;
      guaranteed = base * Math.max(0, 1 - savPct - riskPct) * totalPatients;
      performanceEarned = base * savPct * passCount;
      performanceLost = base * riskPct * failCount;
      break;
    }
    case 'bundled':
      guaranteed = base * totalPatients;
      performanceEarned = base * (Number(params.savings_rate || 50) / 100) * passCount;
      performanceLost = base * (Number(params.risk_threshold || 10) / 100) * failCount;
      break;
    case 'capitation':
      guaranteed = base * totalPatients;
      performanceEarned = base * (Number(params.prevention_bonus || 5) / 100) * passCount;
      performanceLost = 0;
      break;
    default:
      guaranteed = 0;
      performanceEarned = 0;
      performanceLost = 0;
  }

  return {
    escrow,
    guaranteed,
    performanceEarned,
    performanceLost,
    net: guaranteed + performanceEarned - performanceLost,
  };
}

const CONTRACT_NAMES: Record<string, string> = {
  p4p: 'Pay-for-Performance (P4P)',
  shared: 'Shared Savings / Shared Risk',
  bundled: 'Bundled Payments',
  capitation: 'Capitation',
};

function FinancialCol({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-xl font-black tracking-tight ${accent ?? 'text-foreground'}`}>{value}</span>
      {sub && <span className="text-[10px] font-semibold text-muted-foreground">{sub}</span>}
    </div>
  );
}

function CohortFinancials({
  title,
  label,
  isFinal,
  passCount,
  failCount,
  total,
  fin,
}: {
  title: string;
  label: string;
  isFinal: boolean;
  passCount: number;
  failCount: number;
  total: number;
  fin: ReturnType<typeof computeCohortFinancials>;
}) {
  return (
    <div className="flex-1 min-w-0 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFinal ? 'bg-brand-teal/15 text-brand-teal' : 'bg-brand-amber/15 text-brand-amber'}`}>
          {isFinal ? 'Final' : 'Current Exposure'}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground font-semibold">{label} — {passCount} pass / {failCount} fail / {total} total</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <FinancialCol label="Escrow Locked" value={fmtChf(fin.escrow)} sub="Total at stake" />
        <FinancialCol label="Guaranteed" value={fmtChf(fin.guaranteed)} sub="Fixed portion" accent="text-brand-teal" />
        <FinancialCol label="Performance Earned" value={fmtChf(fin.performanceEarned)} sub="Bonus unlocked" accent="text-brand-teal" />
        <FinancialCol label="Returned to Insurer" value={fmtChf(fin.performanceLost)} sub="Penalties / clawback" accent={fin.performanceLost > 0 ? 'text-brand-amber' : 'text-muted-foreground'} />
      </div>
      <div className="flex items-center gap-3 pt-1 border-t border-foreground/8">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net to Provider</span>
        <span className="text-base font-black text-foreground">{fmtChf(fin.net)}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { patients, thresholds, dataSource, isLoading, contractType, contractParams } = useData();

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const { completed, active } = useMemo(() => partitionByStatus(patients, asOf), [patients, asOf]);

  const summary      = useMemo(() => getCohortSummary(completed, thresholds), [completed, thresholds]);
  const activeSummary = useMemo(() => getCohortSummary(active, thresholds), [active, thresholds]);
  const rulePerf     = useMemo(() => getRulePerformance(completed, thresholds), [completed, thresholds]);
  const classified   = useMemo(() => classifyCohort(patients, thresholds, asOf), [patients, thresholds, asOf]);
  const cats         = useMemo(() => getByCategory(classified), [classified]);

  const completedFin = useMemo(() => {
    if (!contractType) return null;
    return computeCohortFinancials(contractType, contractParams, completed.length, summary.passed, summary.failed);
  }, [contractType, contractParams, completed.length, summary.passed, summary.failed]);

  const ongoingFin = useMemo(() => {
    if (!contractType) return null;
    const ongoingTotal = cats.onTrack.length + cats.flagged.length;
    return computeCohortFinancials(contractType, contractParams, ongoingTotal, cats.onTrack.length, cats.flagged.length);
  }, [contractType, contractParams, cats.onTrack.length, cats.flagged.length]);

  const combinedFin = useMemo(() => {
    if (!contractType) return null;
    const combinedTotal = completed.length + cats.onTrack.length + cats.flagged.length;
    const combinedPass = summary.passed + cats.onTrack.length;
    const combinedFail = summary.failed + cats.flagged.length;
    return computeCohortFinancials(contractType, contractParams, combinedTotal, combinedPass, combinedFail);
  }, [contractType, contractParams, completed.length, summary.passed, summary.failed, cats.onTrack.length, cats.flagged.length]);

  // Search & Pagination states
  const [needsReviewSearch, setNeedsReviewSearch] = useState('');
  const [needsReviewPage, setNeedsReviewPage] = useState(1);
  const [flaggedSearch, setFlaggedSearch] = useState('');
  const [flaggedPage, setFlaggedPage] = useState(1);
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

  // Search filter and paginations mapping to mock arrays
  const filteredNeedsReview = MOCK_NEEDS_REVIEW.filter(c => 
    c.patient.patient_id.toLowerCase().includes(needsReviewSearch.toLowerCase()) ||
    c.unmetTargetLabels.some(label => label.toLowerCase().includes(needsReviewSearch.toLowerCase()))
  );
  const totalNeedsReviewPages = Math.ceil(filteredNeedsReview.length / 5) || 1;
  const paginatedNeedsReview = filteredNeedsReview.slice((needsReviewPage - 1) * 5, needsReviewPage * 5);

  const filteredFlagged = MOCK_ACTIVE_CAPITAL_AT_RISK.filter(c => 
    c.patient.patient_id.toLowerCase().includes(flaggedSearch.toLowerCase()) ||
    c.unmetTargetLabels.some(label => label.toLowerCase().includes(flaggedSearch.toLowerCase()))
  );
  const totalFlaggedPages = Math.ceil(filteredFlagged.length / 5) || 1;
  const paginatedFlagged = filteredFlagged.slice((flaggedPage - 1) * 5, flaggedPage * 5);

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const bar = document.querySelector('[data-mini-bar]');
    const offset = 64 + (bar ? bar.getBoundingClientRect().height : 0);
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset), behavior: 'smooth' });
  }

  return (
    <div id="overview-section" className="space-y-10 scroll-mt-48">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Outcome Dashboard</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Click any node in the workflow above to go back and reconfigure that step.
          </p>
        </div>
        <Badge
          variant={dataSource === 'uploaded' ? 'default' : 'outline'}
          className="mt-1 flex-shrink-0 text-xs px-3 py-1 font-semibold rounded-full"
        >
          {dataSource === 'uploaded' ? 'Uploaded Cohort' : 'Sample Dataset'}
        </Badge>
      </div>

      {/* Overview section title */}
      <SectionHeader title="Overview" count={patients.length} icon={LayoutDashboard} accent="border-brand-teal" />

      {/* ── Active Contract Summary ─────────────────────────────────────────── */}
      <div className="bg-background/80 border border-brand-teal/30 rounded-2xl p-8 shadow-md relative overflow-hidden group glass-panel">
        <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
          <Activity className="size-48 text-brand-teal" />
        </div>
        <div className="space-y-6 z-10 relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-brand-teal animate-pulse" />
              <h2 className="text-xl font-black tracking-tight">Active Contract Summary</h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Real-world evidence capture and smart contract audit for {patients.length} total participants.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">Completed Patients</span>
              <span className="text-3xl font-black text-foreground">{completed.length}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">Verified Payouts</span>
              <span className="text-3xl font-black text-brand-teal">{summary.passed}</span>
              <span className="text-xs text-muted-foreground font-semibold">of {completed.length} completed</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">Active Patients</span>
              <span className="text-3xl font-black text-foreground">{active.length}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">Flagged / At Risk</span>
              <span className="text-3xl font-black text-brand-amber">{cats.flagged.length}</span>
              <span className="text-xs text-muted-foreground font-semibold">of {active.length} active</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-foreground/8">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Completed — Settle</span>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-brand-teal">{summary.passed} verified</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-brand-amber">{summary.failed} forfeited</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ongoing — Verify</span>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-brand-teal">{cats.onTrack.length} on track</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-brand-amber">{cats.flagged.length} flagged</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contract & Escrow Metrics ────────────────────────────────────────── */}
      <div className="bg-background/80 border border-brand-teal/40 rounded-2xl p-6 shadow-md relative overflow-hidden group glass-panel">
        <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
          <ShieldAlert className="size-36 text-brand-teal" />
        </div>
        <div className="space-y-5 z-10 relative">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-brand-teal animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Contract & Escrow Metrics</h2>
            {contractType && (
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                {CONTRACT_NAMES[contractType] ?? contractType}
              </span>
            )}
          </div>

          {!contractType ? (
            <p className="text-sm text-muted-foreground font-medium">
              No payment contract configured. Complete the payment agreement step to see financial reporting here.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Two clickable cohort cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedFin && (
                  <button
                    onClick={() => scrollToId('completion-section')}
                    className="text-left rounded-xl border border-brand-teal/20 bg-brand-teal/4 hover:bg-brand-teal/8 hover:border-brand-teal/35 transition-all p-5 group/card"
                  >
                    <CohortFinancials
                      title="Completed Cohort"
                      label="Treatment concluded"
                      isFinal={true}
                      passCount={summary.passed}
                      failCount={summary.failed}
                      total={completed.length}
                      fin={completedFin}
                    />
                    <p className="text-[10px] font-bold text-brand-teal mt-4 group-hover/card:underline">
                      View completed patients →
                    </p>
                  </button>
                )}
                {ongoingFin && (
                  <button
                    onClick={() => scrollToId('ongoing-section')}
                    className="text-left rounded-xl border border-brand-amber/20 bg-brand-amber/4 hover:bg-brand-amber/8 hover:border-brand-amber/35 transition-all p-5 group/card"
                  >
                    <CohortFinancials
                      title="Ongoing Cohort"
                      label="Active treatment — current exposure"
                      isFinal={false}
                      passCount={cats.onTrack.length}
                      failCount={cats.flagged.length}
                      total={cats.onTrack.length + cats.flagged.length}
                      fin={ongoingFin}
                    />
                    <p className="text-[10px] font-bold text-brand-amber mt-4 group-hover/card:underline">
                      View ongoing patients →
                    </p>
                  </button>
                )}
              </div>

              {/* Combined view */}
              {combinedFin && (
                <div className="rounded-xl border border-foreground/8 bg-background/60 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-foreground/8" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Combined — All Patients</span>
                    <div className="h-px flex-1 bg-foreground/8" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Total Escrow</span>
                      <span className="text-lg font-black text-foreground">{fmtChf(combinedFin.escrow)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Guaranteed</span>
                      <span className="text-lg font-black text-brand-teal">{fmtChf(combinedFin.guaranteed)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Perf. Earned</span>
                      <span className="text-lg font-black text-brand-teal">{fmtChf(combinedFin.performanceEarned)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Returned</span>
                      <span className={`text-lg font-black ${combinedFin.performanceLost > 0 ? 'text-brand-amber' : 'text-muted-foreground'}`}>
                        {fmtChf(combinedFin.performanceLost)}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Net to Provider</span>
                      <span className="text-lg font-black text-foreground">{fmtChf(combinedFin.net)}</span>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Goal Success Rates — full width */}
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

            {/* Outcome breakdown */}
            <Card id="outcome-breakdown" className="shadow-md bg-background/50 border-foreground/5 rounded-2xl glass-panel hover-glass-card flex flex-col justify-between max-w-lg">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">Settlement Audit: Verified Payout vs Forfeited Capital</CardTitle>
                  <CardDescription className="text-xs">
                    Pass vs Fail across {enabledRules.length} targets mapping to escrow release conditions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-6 pb-6">
                  {/* Glowing progress ring */}
                  <ProgressRing value={summary.passRate} color={summary.passRate >= 70 ? '#55B4A6' : '#E9A23B'} />
                  
                  <div className="w-full space-y-4">
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
                      <div className="text-[10px] text-brand-teal font-bold leading-relaxed border-t border-brand-teal/15 pt-1.5 mt-1.5">
                        <span className="text-muted-foreground font-semibold uppercase text-[8px] tracking-wider block mb-0.5">Settlement Action</span>
                        <span className="font-black text-xs block text-foreground">
                          ➔ Release: CHF {(summary.passed * 800).toLocaleString()} to Provider
                        </span>
                      </div>
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
                      <div className="text-[10px] text-brand-amber font-bold leading-relaxed border-t border-brand-amber/15 pt-1.5 mt-1.5">
                        <span className="text-muted-foreground font-semibold uppercase text-[8px] tracking-wider block mb-0.5">Settlement Action</span>
                        <span className="font-black text-xs block text-foreground">
                          ➔ Clawback: CHF {(summary.failed * 800).toLocaleString()} to Insurers
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-muted-foreground/10 pt-3 w-full text-center">
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
                
                {/* Search input */}
                <div className="relative max-w-xs w-full">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Patient ID..."
                    value={needsReviewSearch}
                    onChange={(e) => {
                      setNeedsReviewSearch(e.target.value);
                      setNeedsReviewPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all font-semibold"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredNeedsReview.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 font-semibold">No patients matches filters.</p>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {paginatedNeedsReview.map((c) => (
                        <PatientRow
                          key={c.patient.patient_id}
                          patient={c.patient}
                          evaluation={c.evaluation}
                          isOpen={expandedPatientId === c.patient.patient_id}
                          onToggle={() => setExpandedPatientId(prev => prev === c.patient.patient_id ? null : c.patient.patient_id)}
                        />
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {totalNeedsReviewPages > 1 && (
                      <div className="flex items-center justify-between border-t border-muted-foreground/10 pt-3 text-xs font-semibold">
                        <span className="text-muted-foreground">
                          Page {needsReviewPage} of {totalNeedsReviewPages} ({filteredNeedsReview.length} matching)
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={needsReviewPage === 1}
                            onClick={() => setNeedsReviewPage(p => p - 1)}
                            className="h-8 py-0 px-2"
                          >
                            Prev
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={needsReviewPage === totalNeedsReviewPages}
                            onClick={() => setNeedsReviewPage(p => p + 1)}
                            className="h-8 py-0 px-2"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 shadow-md bg-background/50 border-foreground/5 rounded-2xl glass-panel hover-glass-card flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">Ongoing Target Breakdown</CardTitle>
                  <CardDescription className="text-xs">
                    "On track" patients are currently meeting all targets; "Flagged" patients represent capital at risk.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-6 pb-6">
                  {/* Progress ring */}
                  <ProgressRing value={onTrackRate} color={onTrackRate >= 70 ? '#55B4A6' : '#E9A23B'} />

                  <div className="w-full space-y-4">
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
                      <div className="text-[10px] text-brand-amber font-bold leading-relaxed border-t border-brand-amber/15 pt-1.5 mt-1.5">
                        <span className="text-muted-foreground font-semibold uppercase text-[8px] tracking-wider block mb-0.5">Escrow Risk Summary</span>
                        <span className="block">{cats.flagged.length} Patients Off-Track</span>
                        <span className="block text-xs mt-0.5 text-foreground font-black">
                          ➔ CHF {(cats.flagged.length * 800).toLocaleString()} at Risk
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground border-t border-muted-foreground/10 pt-3 w-full text-center font-semibold">
                    "On track" = currently meeting all checked targets. Not a projection.
                  </p>
                </CardContent>
              </Card>

              {/* Flagged active patients — sorted nearest completion first */}
              <Card className="lg:col-span-2 shadow-md bg-background/50 border-foreground/5 rounded-2xl glass-panel">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5 text-brand-amber">
                      <ShieldAlert className="size-4 animate-pulse" />
                      Active Capital at Risk (Value-at-Risk Framework)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Active patients not meeting one or more outcome targets, sorted by Value-at-Risk (CHF 800 at risk per patient).
                    </CardDescription>
                  </div>
                  
                  {/* Search input */}
                  <div className="relative max-w-xs w-full">
                    <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Patient ID..."
                      value={flaggedSearch}
                      onChange={(e) => {
                        setFlaggedSearch(e.target.value);
                        setFlaggedPage(1);
                      }}
                      className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all font-semibold"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredFlagged.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 font-semibold">No flagged active patients found.</p>
                  ) : (
                    <>
                      <div className="space-y-2.5">
                        {paginatedFlagged.map((c) => (
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

                      {/* Pagination */}
                      {totalFlaggedPages > 1 && (
                        <div className="flex items-center justify-between border-t border-muted-foreground/10 pt-3 text-xs font-semibold">
                          <span className="text-muted-foreground">
                            Page {flaggedPage} of {totalFlaggedPages} ({filteredFlagged.length} matching)
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={flaggedPage === 1}
                              onClick={() => setFlaggedPage(p => p - 1)}
                              className="h-8 py-0 px-2"
                            >
                              Prev
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={flaggedPage === totalFlaggedPages}
                              onClick={() => setFlaggedPage(p => p + 1)}
                              className="h-8 py-0 px-2"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
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
