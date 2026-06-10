import Papa from 'papaparse';
import { type PatientRecord, PATIENT_CSV_COLUMNS } from './schema';

export function parsePatientCsv(csvText: string): PatientRecord[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row) => {
    const record: Partial<PatientRecord> = {};
    for (const col of PATIENT_CSV_COLUMNS) {
      const raw = row[col.name] ?? '';
      (record as Record<string, unknown>)[col.name] =
        col.type === 'number' ? parseFloat(raw) : raw;
    }
    return record as PatientRecord;
  });
}
