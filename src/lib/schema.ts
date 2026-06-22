/**
 * Core data contract for SanaFin patient records.
 */

export type PatientRecord = {
  patient_id: string;             // anonymized unique ID
  enrollment_date: string;        // ISO date (YYYY-MM-DD), program start date
  end_date?: string;              // ISO date — legacy field, not present in current CSV
  last_measurement_date: string;  // ISO date (YYYY-MM-DD), date of latest clinical readings
  baseline_hba1c: number;         // HbA1c % at enrollment
  latest_hba1c: number;           // most recent HbA1c %
  cgm_time_in_range: number;      // % of time glucose in 70–180 mg/dL target range (integer 0–100)
  baseline_weight_kg: number;     // weight (kg) at enrollment
  latest_weight_kg: number;       // most recent weight (kg)
  sessions_attended: number;      // program sessions completed (absolute count)
  total_sessions?: number;        // total sessions in the program — legacy field, not in current CSV
  // Cost and status fields (present in current CSV template)
  program_status: 'completed' | 'active';  // settled episode vs ongoing
  complications: number;          // adverse event count during episode
  benchmark_cost_chf: number;     // risk-adjusted full-episode cost target (CHF)
  actual_cost_chf: number;        // cost-to-date (final if completed; partial if active)
};

type ColumnSpec = {
  name: keyof PatientRecord;
  type: 'string' | 'number';
  required: boolean;
};

/** Column specification for CSV upload validation. */
export const PATIENT_CSV_COLUMNS: ColumnSpec[] = [
  { name: 'patient_id',            type: 'string', required: true },
  { name: 'enrollment_date',       type: 'string', required: true },
  { name: 'last_measurement_date', type: 'string', required: true },
  { name: 'baseline_hba1c',        type: 'number', required: true },
  { name: 'latest_hba1c',          type: 'number', required: true },
  { name: 'cgm_time_in_range',     type: 'number', required: true },
  { name: 'baseline_weight_kg',    type: 'number', required: true },
  { name: 'latest_weight_kg',      type: 'number', required: true },
  { name: 'sessions_attended',     type: 'number', required: true },
  { name: 'program_status',        type: 'string', required: true },
  { name: 'complications',         type: 'number', required: true },
  { name: 'benchmark_cost_chf',    type: 'number', required: true },
  { name: 'actual_cost_chf',       type: 'number', required: true },
];
