/**
 * Core data contract for SanaFin patient records.
 *
 * Field-name notes vs. WorkflowView.tsx (for later refactor):
 *   WorkflowView `id`            → `patient_id`
 *   WorkflowView `hba1c_baseline`→ `baseline_hba1c`  (word order flipped)
 *   WorkflowView `hba1c_followup`→ `latest_hba1c`    (renamed: "followup" → "latest")
 *   WorkflowView `cgm_tir`       → `cgm_time_in_range` (abbreviation expanded)
 *   WorkflowView `date`          → split into `enrollment_date` + `last_measurement_date`
 *   New fields (no WV equivalent): `baseline_weight_kg`, `latest_weight_kg`, `sessions_attended`
 */

export type PatientRecord = {
  patient_id: string;             // anonymized unique ID
  enrollment_date: string;        // ISO date (YYYY-MM-DD), program start date
  end_date: string;               // ISO date (YYYY-MM-DD), program end date (1 year after enrollment)
  last_measurement_date: string;  // ISO date (YYYY-MM-DD), date of latest clinical readings
  baseline_hba1c: number;         // HbA1c % at enrollment
  latest_hba1c: number;           // most recent HbA1c %
  cgm_time_in_range: number;      // % of time glucose in 70–180 mg/dL target range (integer 0–100)
  baseline_weight_kg: number;     // weight (kg) at enrollment
  latest_weight_kg: number;       // most recent weight (kg)
  sessions_attended: number;      // program sessions completed (absolute count)
  total_sessions: number;         // total sessions in the program
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
  { name: 'end_date',              type: 'string', required: true },
  { name: 'last_measurement_date', type: 'string', required: true },
  { name: 'baseline_hba1c',        type: 'number', required: true },
  { name: 'latest_hba1c',          type: 'number', required: true },
  { name: 'cgm_time_in_range',     type: 'number', required: true },
  { name: 'baseline_weight_kg',    type: 'number', required: true },
  { name: 'latest_weight_kg',      type: 'number', required: true },
  { name: 'sessions_attended',     type: 'number', required: true },
  { name: 'total_sessions',        type: 'number', required: true },
];
