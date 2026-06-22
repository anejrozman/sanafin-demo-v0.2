/**
 * Pure payout selectors — no storage, all derived.
 *
 * Implements four contract types:
 *   P4P           — guaranteed base + quality-weighted bonus; no cost risk
 *   Shared Savings — provider shares savings/losses vs a benchmark
 *   Bundled        — fixed episode price; provider keeps/absorbs margin
 *   Capitation     — fixed PMPM regardless of usage; provider bears full cost risk
 */

import { type PatientRecord } from './schema';
import { type Thresholds } from './thresholds';
import { evaluatePatient, getRulePerformance } from './selectors';

// ─── Contract parameter types ─────────────────────────────────────────────────

export interface P4PContract {
  type: 'p4p';
  episodeMonths: number;
  totalPayoutPerPatient: number;
  bonusFraction: number;           // e.g. 0.30 → 30 % is bonus pool
  weights: Record<string, number>; // ruleId → fraction of bonus pool (sum to 1)
}

export interface SharedSavingsContract {
  type: 'shared';
  episodeMonths: number;
  savingsShare: number;  // e.g. 0.50 → provider keeps 50 % of savings
  twoSided: boolean;
  lossShare: number;     // only used when twoSided; e.g. 0.50 → provider absorbs 50 % of overage
}

export interface BundledContract {
  type: 'bundled';
  episodeMonths: number;
  bundlePrice: number;       // fixed episode payment (CHF)
  complicationCap: number;   // max complications to still pass quality gate (default 1)
}

export interface CapitationContract {
  type: 'capitation';
  episodeMonths: number;
  pmpm: number;  // per-member-per-month rate (CHF)
}

export type Contract =
  | P4PContract
  | SharedSavingsContract
  | BundledContract
  | CapitationContract;

// ─── Parse flat params → typed Contract ──────────────────────────────────────

export function parseContract(
  contractType: string,
  params: Record<string, string | number>,
  thresholds: Thresholds,
): Contract | null {
  const episodeMonths = Number(params.episodeMonths ?? 6);

  switch (contractType) {
    case 'p4p': {
      const enabledRules = thresholds.rules.filter(r => r.enabled);
      const n = enabledRules.length || 1;
      const weights: Record<string, number> = {};
      for (const rule of enabledRules) {
        weights[rule.id] = Number(params[`weight_${rule.id}`] ?? (1 / n));
      }
      return {
        type: 'p4p',
        episodeMonths,
        totalPayoutPerPatient: Number(params.totalPayoutPerPatient ?? 5000),
        bonusFraction: Number(params.bonusFraction ?? 0.3),
        weights,
      };
    }
    case 'shared':
      return {
        type: 'shared',
        episodeMonths,
        savingsShare: Number(params.savingsShare ?? 0.5),
        twoSided: params.twoSided === 'Yes' || Number(params.twoSided) === 1,
        lossShare: Number(params.lossShare ?? 0.5),
      };
    case 'bundled':
      return {
        type: 'bundled',
        episodeMonths,
        bundlePrice: Number(params.bundlePrice ?? 8000),
        complicationCap: Number(params.complicationCap ?? 1),
      };
    case 'capitation':
      return {
        type: 'capitation',
        episodeMonths,
        pmpm: Number(params.pmpm ?? 1200),
      };
    default:
      return null;
  }
}

// ─── Shared per-patient quantities ────────────────────────────────────────────

/** Months elapsed between enrollment and last measurement (floor 0.5 to avoid ÷0). */
function monthsObserved(patient: PatientRecord): number {
  const start = new Date(patient.enrollment_date).getTime();
  const end = new Date(patient.last_measurement_date).getTime();
  return Math.max((end - start) / (1000 * 60 * 60 * 24 * 30.4375), 0.5);
}

/**
 * Settled cost for a completed patient; projected full-episode cost for an active patient.
 * Projection = actual_cost_chf × (episodeMonths / monthsObserved), floored at actual.
 */
function getContractCost(patient: PatientRecord, episodeMonths: number): number {
  if (patient.program_status === 'completed') return patient.actual_cost_chf;
  const months = monthsObserved(patient);
  return Math.max(patient.actual_cost_chf * (episodeMonths / months), patient.actual_cost_chf);
}

// ─── Per-patient result types ──────────────────────────────────────────────────

export interface P4PResult {
  contractType: 'p4p';
  patientId: string;
  isProjected: boolean;
  passesGate: boolean;
  guarantee: number;
  bonusPool: number;
  achievement: number;  // 0–1 weighted fraction of bonus pool earned
  payout: number;
}

export interface SharedSavingsResult {
  contractType: 'shared';
  patientId: string;
  isProjected: boolean;
  passesGate: boolean;
  benchmark: number;
  contractCost: number;
  grossSavings: number;
  result: number;  // positive = earned, negative = owed
}

export interface BundledResult {
  contractType: 'bundled';
  patientId: string;
  isProjected: boolean;
  passesGate: boolean;
  gateOk: boolean;       // passes quality + complications gate
  contractCost: number;
  margin: number;        // bundlePrice − contractCost
  result: number;        // kept savings or absorbed loss
}

export interface CapitationResult {
  contractType: 'capitation';
  patientId: string;
  isProjected: boolean;
  contractCost: number;
  capitationRevenue: number;  // pmpm × episodeMonths
  margin: number;
  result: number;
  revenueToDate: number;      // pmpm × min(monthsObserved, episodeMonths)
}

export type PayoutResult =
  | P4PResult
  | SharedSavingsResult
  | BundledResult
  | CapitationResult;

// ─── Per-patient payout dispatcher ────────────────────────────────────────────

export function computePayout(
  patient: PatientRecord,
  contract: Contract,
  thresholds: Thresholds,
): PayoutResult {
  const evaluation = evaluatePatient(patient, thresholds);
  const passes = evaluation.passed;
  const isProjected = patient.program_status === 'active';

  switch (contract.type) {
    case 'p4p': {
      const enabledRules = thresholds.rules.filter(r => r.enabled);
      const n = enabledRules.length || 1;
      let achievement = 0;
      for (const rule of enabledRules) {
        const rr = evaluation.ruleResults.find(r => r.ruleId === rule.id);
        const weight = contract.weights[rule.id] ?? (1 / n);
        if (rr?.passed) achievement += weight;
      }
      const guarantee = (1 - contract.bonusFraction) * contract.totalPayoutPerPatient;
      const bonusPool = contract.bonusFraction * contract.totalPayoutPerPatient;
      return {
        contractType: 'p4p',
        patientId: patient.patient_id,
        isProjected,
        passesGate: passes,
        guarantee,
        bonusPool,
        achievement,
        payout: guarantee + bonusPool * achievement,
      };
    }

    case 'shared': {
      const cost = getContractCost(patient, contract.episodeMonths);
      const benchmark = patient.benchmark_cost_chf;
      const grossSavings = benchmark - cost;
      let result: number;
      if (grossSavings >= 0) {
        result = passes ? contract.savingsShare * grossSavings : 0;
      } else {
        result = contract.twoSided ? contract.lossShare * grossSavings : 0;
      }
      return {
        contractType: 'shared',
        patientId: patient.patient_id,
        isProjected,
        passesGate: passes,
        benchmark,
        contractCost: cost,
        grossSavings,
        result,
      };
    }

    case 'bundled': {
      const cost = getContractCost(patient, contract.episodeMonths);
      const margin = contract.bundlePrice - cost;
      const gateOk = passes && (patient.complications ?? 0) <= contract.complicationCap;
      const result = margin >= 0 ? (gateOk ? margin : 0) : margin;
      return {
        contractType: 'bundled',
        patientId: patient.patient_id,
        isProjected,
        passesGate: passes,
        gateOk,
        contractCost: cost,
        margin,
        result,
      };
    }

    case 'capitation': {
      const cost = getContractCost(patient, contract.episodeMonths);
      const capitationRevenue = contract.pmpm * contract.episodeMonths;
      const margin = capitationRevenue - cost;
      const revenueToDate = contract.pmpm * Math.min(monthsObserved(patient), contract.episodeMonths);
      return {
        contractType: 'capitation',
        patientId: patient.patient_id,
        isProjected,
        contractCost: cost,
        capitationRevenue,
        margin,
        result: margin,
        revenueToDate,
      };
    }
  }
}

// ─── Cohort-level metric types ────────────────────────────────────────────────

export interface P4PCohortMetrics {
  count: number;
  totalPayout: number;
  totalGuarantee: number;
  totalBonusEarned: number;
  bonusPoolTotal: number;
  bonusPoolUtilization: number;  // 0–100 %
  perGoalPassRate: Record<string, number>;  // ruleId → 0–100 %
}

export interface SharedCohortMetrics {
  count: number;
  totalBenchmark: number;
  totalCost: number;
  grossSavings: number;
  providerNet: number;
  gateEligibleCount: number;
}

export interface BundledCohortMetrics {
  count: number;
  totalBundleRevenue: number;
  totalCost: number;
  netMargin: number;
  profitableCount: number;
  lossMakingCount: number;
  gateFailureCount: number;
}

export interface CapitationCohortMetrics {
  count: number;
  totalRevenue: number;
  totalCost: number;
  netMargin: number;
  avgPerPatientMargin: number;
  marginNegativeCount: number;
}

// ─── Cohort report types ──────────────────────────────────────────────────────

export interface P4PCohortReport {
  metrics: P4PCohortMetrics;
  results: P4PResult[];
}

export interface SharedCohortReport {
  metrics: SharedCohortMetrics;
  results: SharedSavingsResult[];
}

export interface BundledCohortReport {
  metrics: BundledCohortMetrics;
  results: BundledResult[];
}

export interface CapitationCohortReport {
  metrics: CapitationCohortMetrics;
  results: CapitationResult[];
}

export type P4PReport = {
  contractType: 'p4p';
  completed: P4PCohortReport;
  active: P4PCohortReport;
  combined: P4PCohortReport;
};

export type SharedReport = {
  contractType: 'shared';
  completed: SharedCohortReport;
  active: SharedCohortReport;
  combined: SharedCohortReport;
};

export type BundledReport = {
  contractType: 'bundled';
  completed: BundledCohortReport;
  active: BundledCohortReport;
  combined: BundledCohortReport;
};

export type CapitationReport = {
  contractType: 'capitation';
  completed: CapitationCohortReport;
  active: CapitationCohortReport;
  combined: CapitationCohortReport;
};

export type ContractReport =
  | P4PReport
  | SharedReport
  | BundledReport
  | CapitationReport;

// ─── Cohort aggregation helpers ───────────────────────────────────────────────

function aggregateP4P(
  results: P4PResult[],
  patients: PatientRecord[],
  thresholds: Thresholds,
): P4PCohortMetrics {
  const count = results.length;
  const totalPayout = results.reduce((s, r) => s + r.payout, 0);
  const totalGuarantee = results.reduce((s, r) => s + r.guarantee, 0);
  const bonusPoolTotal = results.reduce((s, r) => s + r.bonusPool, 0);
  const totalBonusEarned = results.reduce((s, r) => s + r.bonusPool * r.achievement, 0);
  const bonusPoolUtilization = bonusPoolTotal > 0 ? (totalBonusEarned / bonusPoolTotal) * 100 : 0;
  const perGoalPassRate: Record<string, number> = {};
  for (const rp of getRulePerformance(patients, thresholds)) {
    perGoalPassRate[rp.ruleId] = rp.passRate;
  }
  return { count, totalPayout, totalGuarantee, totalBonusEarned, bonusPoolTotal, bonusPoolUtilization, perGoalPassRate };
}

function aggregateShared(results: SharedSavingsResult[]): SharedCohortMetrics {
  const count = results.length;
  return {
    count,
    totalBenchmark: results.reduce((s, r) => s + r.benchmark, 0),
    totalCost: results.reduce((s, r) => s + r.contractCost, 0),
    grossSavings: results.reduce((s, r) => s + r.grossSavings, 0),
    providerNet: results.reduce((s, r) => s + r.result, 0),
    gateEligibleCount: results.filter(r => r.passesGate).length,
  };
}

function aggregateBundled(results: BundledResult[]): BundledCohortMetrics {
  const count = results.length;
  return {
    count,
    // bundlePrice = margin + contractCost, so Σ(margin + contractCost) = n × bundlePrice
    totalBundleRevenue: results.reduce((s, r) => s + r.margin + r.contractCost, 0),
    totalCost: results.reduce((s, r) => s + r.contractCost, 0),
    netMargin: results.reduce((s, r) => s + r.result, 0),
    profitableCount: results.filter(r => r.result > 0).length,
    lossMakingCount: results.filter(r => r.result < 0).length,
    gateFailureCount: results.filter(r => !r.gateOk).length,
  };
}

function aggregateCapitation(results: CapitationResult[]): CapitationCohortMetrics {
  const count = results.length;
  const netMargin = results.reduce((s, r) => s + r.margin, 0);
  return {
    count,
    totalRevenue: results.reduce((s, r) => s + r.capitationRevenue, 0),
    totalCost: results.reduce((s, r) => s + r.contractCost, 0),
    netMargin,
    avgPerPatientMargin: count > 0 ? netMargin / count : 0,
    marginNegativeCount: results.filter(r => r.margin < 0).length,
  };
}

// ─── Main report function ─────────────────────────────────────────────────────

/**
 * Pure, recompute-on-any-change function.
 * Splits patients by program_status, computes per-patient payouts, aggregates per cohort.
 */
export function computeContractReport(
  patients: PatientRecord[],
  contract: Contract,
  thresholds: Thresholds,
): ContractReport {
  const completed = patients.filter(p => p.program_status === 'completed');
  const active = patients.filter(p => p.program_status === 'active');

  switch (contract.type) {
    case 'p4p': {
      const cR = completed.map(p => computePayout(p, contract, thresholds) as P4PResult);
      const aR = active.map(p => computePayout(p, contract, thresholds) as P4PResult);
      const allR = [...cR, ...aR];
      return {
        contractType: 'p4p',
        completed: { metrics: aggregateP4P(cR, completed, thresholds), results: cR },
        active:    { metrics: aggregateP4P(aR, active, thresholds), results: aR },
        combined:  { metrics: aggregateP4P(allR, patients, thresholds), results: allR },
      };
    }
    case 'shared': {
      const cR = completed.map(p => computePayout(p, contract, thresholds) as SharedSavingsResult);
      const aR = active.map(p => computePayout(p, contract, thresholds) as SharedSavingsResult);
      const allR = [...cR, ...aR];
      return {
        contractType: 'shared',
        completed: { metrics: aggregateShared(cR), results: cR },
        active:    { metrics: aggregateShared(aR), results: aR },
        combined:  { metrics: aggregateShared(allR), results: allR },
      };
    }
    case 'bundled': {
      const cR = completed.map(p => computePayout(p, contract, thresholds) as BundledResult);
      const aR = active.map(p => computePayout(p, contract, thresholds) as BundledResult);
      const allR = [...cR, ...aR];
      return {
        contractType: 'bundled',
        completed: { metrics: aggregateBundled(cR), results: cR },
        active:    { metrics: aggregateBundled(aR), results: aR },
        combined:  { metrics: aggregateBundled(allR), results: allR },
      };
    }
    case 'capitation': {
      const cR = completed.map(p => computePayout(p, contract, thresholds) as CapitationResult);
      const aR = active.map(p => computePayout(p, contract, thresholds) as CapitationResult);
      const allR = [...cR, ...aR];
      return {
        contractType: 'capitation',
        completed: { metrics: aggregateCapitation(cR), results: cR },
        active:    { metrics: aggregateCapitation(aR), results: aR },
        combined:  { metrics: aggregateCapitation(allR), results: allR },
      };
    }
  }
}
