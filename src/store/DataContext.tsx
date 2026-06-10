import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { type PatientRecord } from '../lib/schema';
import { type Thresholds, DEFAULT_THRESHOLDS } from '../lib/thresholds';
import { parsePatientCsv } from '../lib/parsePatientCsv';

const LS_PATIENTS = 'sanafin:patients';
const LS_DATA_SOURCE = 'sanafin:dataSource';
const LS_THRESHOLDS = 'sanafin:thresholds';

interface DataState {
  patients: PatientRecord[];
  dataSource: 'sample' | 'uploaded';
  thresholds: Thresholds;
  isLoading: boolean;
  setUploadedPatients: (patients: PatientRecord[]) => void;
  clearUploadedData: () => void;
  setThresholds: (t: Thresholds) => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [dataSource, setDataSource] = useState<'sample' | 'uploaded'>('sample');
  const [thresholds, setThresholdsState] = useState<Thresholds>(() => {
    try {
      const stored = localStorage.getItem(LS_THRESHOLDS);
      return stored ? (JSON.parse(stored) as Thresholds) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const sampleCacheRef = useRef<PatientRecord[] | null>(null);

  useEffect(() => {
    const storedSource = localStorage.getItem(LS_DATA_SOURCE) as 'uploaded' | null;
    const storedPatients = localStorage.getItem(LS_PATIENTS);

    if (storedSource === 'uploaded' && storedPatients) {
      try {
        const parsed = JSON.parse(storedPatients) as PatientRecord[];
        setPatients(parsed);
        setDataSource('uploaded');
        setIsLoading(false);
        return;
      } catch {
        // fall through to sample fetch
      }
    }

    fetch('/sanafin-patient-template.csv')
      .then((r) => r.text())
      .then((csv) => {
        const records = parsePatientCsv(csv);
        sampleCacheRef.current = records;
        setPatients(records);
        setDataSource('sample');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setUploadedPatients = (newPatients: PatientRecord[]) => {
    setPatients(newPatients);
    setDataSource('uploaded');
    localStorage.setItem(LS_PATIENTS, JSON.stringify(newPatients));
    localStorage.setItem(LS_DATA_SOURCE, 'uploaded');
  };

  const clearUploadedData = () => {
    localStorage.removeItem(LS_PATIENTS);
    localStorage.removeItem(LS_DATA_SOURCE);

    if (sampleCacheRef.current) {
      setPatients(sampleCacheRef.current);
      setDataSource('sample');
    } else {
      setIsLoading(true);
      fetch('/sanafin-patient-template.csv')
        .then((r) => r.text())
        .then((csv) => {
          const records = parsePatientCsv(csv);
          sampleCacheRef.current = records;
          setPatients(records);
          setDataSource('sample');
        })
        .finally(() => setIsLoading(false));
    }
  };

  const setThresholds = (t: Thresholds) => {
    setThresholdsState(t);
    localStorage.setItem(LS_THRESHOLDS, JSON.stringify(t));
  };

  return (
    <DataContext.Provider
      value={{ patients, dataSource, thresholds, isLoading, setUploadedPatients, clearUploadedData, setThresholds }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}
