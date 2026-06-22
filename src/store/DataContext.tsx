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
  processed: boolean;
  animationSeen: boolean;
  // Workflow navigation state — written by WorkflowCanvas, read by AppSidebar
  workflowView: 'workflow' | 'dashboard';
  workflowRevealedCount: number;
  workflowCompletedUpTo: number;
  pendingWorkflowScroll: number | null;
  // Payment contract — set when user confirms the PaymentModal
  contractType: string | null;
  contractParams: Record<string, string | number>;
  setUploadedPatients: (patients: PatientRecord[]) => void;
  clearUploadedData: () => void;
  setThresholds: (t: Thresholds) => void;
  setProcessed: (v: boolean) => void;
  setAnimationSeen: (v: boolean) => void;
  setWorkflowView: (v: 'workflow' | 'dashboard') => void;
  setWorkflowRevealedCount: (n: number) => void;
  setWorkflowCompletedUpTo: (n: number) => void;
  setPendingWorkflowScroll: (i: number | null) => void;
  setContractConfig: (type: string, params: Record<string, string | number>) => void;
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
  // True only when uploaded data is already persisted — sample data requires an explicit
  // pipeline run each session.
  const [processed, setProcessedState] = useState(() => {
    return (
      localStorage.getItem(LS_DATA_SOURCE) === 'uploaded' &&
      localStorage.getItem(LS_PATIENTS) !== null
    );
  });
  // True once the pipeline animation has been seen; survives in-session navigation but
  // resets on clear. Uploaded data restored from localStorage starts as true (already seen).
  const [animationSeen, setAnimationSeenState] = useState(() => {
    return (
      localStorage.getItem(LS_DATA_SOURCE) === 'uploaded' &&
      localStorage.getItem(LS_PATIENTS) !== null
    );
  });
  const sampleCacheRef = useRef<PatientRecord[] | null>(null);

  // Workflow nav state shared with sidebar
  const [workflowView, setWorkflowViewState] = useState<'workflow' | 'dashboard'>('workflow');
  const [workflowRevealedCount, setWorkflowRevealedCount] = useState(1);
  const [workflowCompletedUpTo, setWorkflowCompletedUpTo] = useState(-1);
  const [pendingWorkflowScroll, setPendingWorkflowScroll] = useState<number | null>(null);

  // Payment contract config — saved when user confirms the PaymentModal
  const [contractType, setContractTypeState] = useState<string | null>(null);
  const [contractParams, setContractParamsState] = useState<Record<string, string | number>>({});

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

  const setProcessed = (v: boolean) => setProcessedState(v);
  const setAnimationSeen = (v: boolean) => setAnimationSeenState(v);
  const setWorkflowView = (v: 'workflow' | 'dashboard') => setWorkflowViewState(v);
  const setContractConfig = (type: string, params: Record<string, string | number>) => {
    setContractTypeState(type);
    setContractParamsState(params);
  };

  const setUploadedPatients = (newPatients: PatientRecord[]) => {
    setPatients(newPatients);
    setDataSource('uploaded');
    localStorage.setItem(LS_PATIENTS, JSON.stringify(newPatients));
    localStorage.setItem(LS_DATA_SOURCE, 'uploaded');
  };

  const clearUploadedData = () => {
    localStorage.removeItem(LS_PATIENTS);
    localStorage.removeItem(LS_DATA_SOURCE);
    setProcessedState(false);
    setAnimationSeenState(false);

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
      value={{
        patients, dataSource, thresholds, isLoading, processed, animationSeen,
        workflowView, workflowRevealedCount, workflowCompletedUpTo, pendingWorkflowScroll,
        contractType, contractParams,
        setUploadedPatients, clearUploadedData, setThresholds, setProcessed, setAnimationSeen,
        setWorkflowView, setWorkflowRevealedCount, setWorkflowCompletedUpTo, setPendingWorkflowScroll,
        setContractConfig,
      }}
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
