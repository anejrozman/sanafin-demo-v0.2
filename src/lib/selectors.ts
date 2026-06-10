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
    case '>':  return actual >  target;
    case '<':  return actual <  target;
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
