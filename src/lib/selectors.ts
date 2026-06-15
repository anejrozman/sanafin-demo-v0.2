import { type PatientRecord } from './schema';
import { type Thresholds, type OutcomeRule } from './thresholds';

// ─── Derived metrics ────────────────────────────────────────────────────────

export type DerivedMetrics = {
  hba1c_change: number | null;       // baseline − latest  (positive = improvement)
  cgm_time_in_range: number | null;  // raw field
  weight_loss_pct: number | null;    // % body-weight lost (positive = loss)
};

function computeDerivedMetrics(patient: PatientRecord): DerivedMetrics {
  const hba1c_change =
    patient.baseline_hba1c != null && patient.latest_hba1c != null
      ? patient.baseline_hba1c - patient.latest_hba1c
      : null;

  const cgm_time_in_range =
    patient.cgm_time_in_range != null ? patient.cgm_time_in_range : null;

  const weight_loss_pct =
    patient.baseline_weight_kg != null &&
    patient.latest_weight_kg != null &&
    patient.baseline_weight_kg !== 0
      ? ((patient.baseline_weight_kg - patient.latest_weight_kg) /
          patient.baseline_weight_kg) *
        100
      : null;

  return { hba1c_change, cgm_time_in_range, weight_loss_pct };
}

function resolveMetric(
  metrics: DerivedMetrics,
  metricKey: string,
): number | null {
  if (metricKey in metrics) {
    return (metrics as Record<string, number | null>)[metricKey];
  }
  return null;
}

// ─── Evaluation types ────────────────────────────────────────────────────────

export type RuleResult = {
  ruleId: string;
  label: string;
  actual: number | null;
  target: number;
  operator: OutcomeRule['operator'];
  unit: string;
  passed: boolean;
};

export type PatientEvaluation = {
  patientId: string;
  patient: PatientRecord;
  metrics: DerivedMetrics;
  ruleResults: RuleResult[];
  passed: boolean;
};

// ─── Single-patient evaluation ───────────────────────────────────────────────

function applyOperator(
  actual: number | null,
  operator: OutcomeRule['operator'],
  target: number,
): boolean {
  if (actual === null) return false;
  switch (operator) {
    case '>=': return actual >= target;
    case '<=': return actual <= target;
    case '>':  return actual > target;
    case '<':  return actual < target;
    case '=':  return Math.abs(actual - target) < 0.0001;
  }
}

export function evaluatePatient(
  patient: PatientRecord,
  thresholds: Thresholds,
): PatientEvaluation {
  const metrics = computeDerivedMetrics(patient);
  const enabledRules = thresholds.rules.filter((r) => r.enabled);

  const ruleResults: RuleResult[] = enabledRules.map((rule) => {
    const actual = resolveMetric(metrics, rule.metric);
    const passed = applyOperator(actual, rule.operator, rule.value);
    return {
      ruleId: rule.id,
      label: rule.label,
      actual,
      target: rule.value,
      operator: rule.operator,
      unit: rule.unit,
      passed,
    };
  });

  const passedCount = ruleResults.filter((r) => r.passed).length;
  let passed: boolean;

  switch (thresholds.passPolicy) {
    case 'all':
      passed = ruleResults.length > 0 && passedCount === ruleResults.length;
      break;
    case 'any':
      passed = passedCount >= 1;
      break;
    case 'count':
      passed = passedCount >= (thresholds.minRulesToPass ?? 1);
      break;
  }

  return { patientId: patient.patient_id, patient, metrics, ruleResults, passed };
}

// ─── Cohort evaluation ───────────────────────────────────────────────────────

export function evaluateCohort(
  patients: PatientRecord[],
  thresholds: Thresholds,
): PatientEvaluation[] {
  return patients.map((p) => evaluatePatient(p, thresholds));
}

// ─── Aggregate selectors ─────────────────────────────────────────────────────

export type CohortSummary = {
  total: number;
  passed: number;
  failed: number;
  passRate: number;              // 0–100
  avgHba1cChange: number | null;
  avgCgmTimeInRange: number | null;
  avgWeightLossPct: number | null;
};

export function getCohortSummary(
  patients: PatientRecord[],
  thresholds: Thresholds,
): CohortSummary {
  const evaluations = evaluateCohort(patients, thresholds);
  const total = evaluations.length;
  const passed = evaluations.filter((e) => e.passed).length;
  const failed = total - passed;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  function avg(values: (number | null)[]): number | null {
    const nums = values.filter((v): v is number => v !== null);
    return nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : null;
  }

  return {
    total,
    passed,
    failed,
    passRate,
    avgHba1cChange: avg(evaluations.map((e) => e.metrics.hba1c_change)),
    avgCgmTimeInRange: avg(evaluations.map((e) => e.metrics.cgm_time_in_range)),
    avgWeightLossPct: avg(evaluations.map((e) => e.metrics.weight_loss_pct)),
  };
}

export type RulePerformance = {
  ruleId: string;
  label: string;
  passedCount: number;
  failedCount: number;
  passRate: number;  // 0–100
};

export function getRulePerformance(
  patients: PatientRecord[],
  thresholds: Thresholds,
): RulePerformance[] {
  const evaluations = evaluateCohort(patients, thresholds);
  const enabledRules = thresholds.rules.filter((r) => r.enabled);

  return enabledRules.map((rule) => {
    const results = evaluations.flatMap((e) =>
      e.ruleResults.filter((rr) => rr.ruleId === rule.id),
    );
    const passedCount = results.filter((rr) => rr.passed).length;
    const failedCount = results.length - passedCount;
    const passRate = results.length > 0 ? (passedCount / results.length) * 100 : 0;
    return { ruleId: rule.id, label: rule.label, passedCount, failedCount, passRate };
  });
}



// ─── Program status helpers ───────────────────────────────────────────────────

export type ProgramStatus = 'completed' | 'active';

/** The latest last_measurement_date across the cohort — used as the "as of" reference. */
export function getAsOfDate(patients: PatientRecord[]): string | null {
  if (patients.length === 0) return null;
  return patients.reduce(
    (max, p) => (p.last_measurement_date > max ? p.last_measurement_date : max),
    patients[0].last_measurement_date,
  );
}

/** A patient whose program end_date has passed the asOf date is "completed"; otherwise "active". */
export function getProgramStatus(patient: PatientRecord, asOf: string): ProgramStatus {
  return patient.end_date <= asOf ? 'completed' : 'active';
}

export function getStatusCounts(
  patients: PatientRecord[],
  asOf: string,
): { completed: number; active: number; total: number } {
  let completed = 0, active = 0;
  for (const p of patients) {
    if (getProgramStatus(p, asOf) === 'completed') completed++;
    else active++;
  }
  return { completed, active, total: patients.length };
}

export function partitionByStatus(
  patients: PatientRecord[],
  asOf: string,
): { completed: PatientRecord[]; active: PatientRecord[] } {
  const completed: PatientRecord[] = [];
  const active: PatientRecord[] = [];
  for (const p of patients) {
    if (getProgramStatus(p, asOf) === 'completed') completed.push(p);
    else active.push(p);
  }
  return { completed, active };
}



// ─── 2×2 patient classification ───────────────────────────────────────────────

export type PatientCategory = 'pass' | 'fail' | 'on_track' | 'flagged';

export interface ClassifiedPatient {
  patient: PatientRecord;
  category: PatientCategory;
  evaluation: PatientEvaluation;
  daysRemaining: number | null;       // days from asOf to end_date for active; null if completed
  unmetTargetLabels: string[];
  targetGaps: { label: string; gap: number; unit: string }[];
}

export function classifyPatient(
  patient: PatientRecord,
  thresholds: Thresholds,
  asOf: string,
): PatientCategory {
  const evaluation = evaluatePatient(patient, thresholds);
  const status = getProgramStatus(patient, asOf);
  if (status === 'completed') return evaluation.passed ? 'pass' : 'fail';
  return evaluation.passed ? 'on_track' : 'flagged';
}

export function classifyCohort(
  patients: PatientRecord[],
  thresholds: Thresholds,
  asOf: string,
): ClassifiedPatient[] {
  return patients.map(patient => {
    const status = getProgramStatus(patient, asOf);
    const evaluation = evaluatePatient(patient, thresholds);
    const category: PatientCategory =
      status === 'completed'
        ? evaluation.passed ? 'pass' : 'fail'
        : evaluation.passed ? 'on_track' : 'flagged';

    const daysRemaining =
      status === 'active'
        ? Math.max(0, Math.round(
            (new Date(patient.end_date).getTime() - new Date(asOf + 'T00:00:00').getTime()) /
            (1000 * 60 * 60 * 24),
          ))
        : null;

    const unmetTargetLabels = evaluation.ruleResults
      .filter(r => !r.passed)
      .map(r => r.label);

    const targetGaps = evaluation.ruleResults
      .filter(r => !r.passed && r.actual !== null)
      .map(r => ({
        label: r.label,
        gap: Math.abs(r.target - (r.actual as number)),
        unit: r.unit,
      }));

    return { patient, category, evaluation, daysRemaining, unmetTargetLabels, targetGaps };
  });
}

export function getByCategory(classified: ClassifiedPatient[]): {
  pass: ClassifiedPatient[];
  fail: ClassifiedPatient[];
  onTrack: ClassifiedPatient[];
  flagged: ClassifiedPatient[];
} {
  return {
    pass: classified.filter(c => c.category === 'pass'),
    fail: classified.filter(c => c.category === 'fail'),
    onTrack: classified.filter(c => c.category === 'on_track'),
    flagged: classified.filter(c => c.category === 'flagged'),
  };
}

/** Flagged active patients sorted by daysRemaining ASC (nearest end first). */
export function getFlaggedSorted(classified: ClassifiedPatient[]): ClassifiedPatient[] {
  return classified
    .filter(c => c.category === 'flagged')
    .sort((a, b) => {
      if (a.daysRemaining === null) return 1;
      if (b.daysRemaining === null) return -1;
      return a.daysRemaining - b.daysRemaining;
    });
}

// ─── Enrollment span ─────────────────────────────────────────────────────────

export type EnrollmentSpan = {
  earliestEnrollment: string;  // ISO date of first enrolled patient
  latestMeasurement: string;   // ISO date of most recent measurement
  avgProgramDays: number;      // avg days between enrollment and last measurement
};

export function getEnrollmentSpan(patients: PatientRecord[]): EnrollmentSpan | null {
  if (patients.length === 0) return null;

  let earliestEnrollment = patients[0].enrollment_date;
  let latestMeasurement = patients[0].last_measurement_date;
  let totalDays = 0;

  for (const p of patients) {
    if (p.enrollment_date < earliestEnrollment) earliestEnrollment = p.enrollment_date;
    if (p.last_measurement_date > latestMeasurement) latestMeasurement = p.last_measurement_date;
    const enroll = new Date(p.enrollment_date).getTime();
    const meas = new Date(p.last_measurement_date).getTime();
    totalDays += (meas - enroll) / (1000 * 60 * 60 * 24);
  }

  return {
    earliestEnrollment,
    latestMeasurement,
    avgProgramDays: Math.round(totalDays / patients.length),
  };
}
