/**
 * Contract-threshold configuration types and defaults.
 *
 * Metric key reference (used by OutcomeRule.metric):
 *   "hba1c_change"       — derived: PatientRecord.baseline_hba1c − latest_hba1c
 *                          (positive value = improvement)
 *   "cgm_time_in_range"  — direct: PatientRecord.cgm_time_in_range (integer 0–100 %)
 *   "weight_loss_pct"    — derived: 100 × (baseline_weight_kg − latest_weight_kg)
 *                          / baseline_weight_kg (positive value = weight loss)
 */

export interface OutcomeRule {
  id: string;                          // stable key, e.g. "hba1c_reduction"
  label: string;                       // display name, e.g. "HbA1c Reduction"
  metric: string;                      // metric key this rule evaluates (see above)
  operator: '>=' | '<=';
  value: number;                       // configurable target threshold
  unit: string;                        // e.g. "points", "%"
  enabled: boolean;                    // toggled on/off in the config tab later
}

export interface Thresholds {
  rules: OutcomeRule[];
  passPolicy: 'all' | 'any' | 'count'; // how a patient is judged across rules:
                                        //   "all"   — every enabled rule must pass
                                        //   "any"   — at least one enabled rule must pass
                                        //   "count" — at least minRulesToPass rules must pass
  minRulesToPass?: number;              // used only when passPolicy === "count"
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  rules: [
    {
      id: 'hba1c_reduction',
      label: 'HbA1c Reduction',
      metric: 'hba1c_change',
      operator: '>=',
      value: 0.5,
      unit: 'points',
      enabled: true,
    },
    {
      id: 'cgm_time_in_range',
      label: 'CGM Time in Range',
      metric: 'cgm_time_in_range',
      operator: '>=',
      value: 70,
      unit: '%',
      enabled: true,
    },
    {
      id: 'weight_loss',
      label: 'Weight Loss',
      metric: 'weight_loss_pct',
      operator: '>=',
      value: 5,
      unit: '%',
      enabled: true,
    },
  ],
  passPolicy: 'all',
};
