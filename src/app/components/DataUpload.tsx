import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { parsePatientCsv } from '../../lib/parsePatientCsv';
import { PATIENT_CSV_COLUMNS } from '../../lib/schema';
import { getAsOfDate, getStatusCounts } from '../../lib/selectors';

interface DataUploadProps {
  initialTab?: 'sample' | 'upload';
}

export default function DataUpload({ initialTab }: DataUploadProps) {
  const {
    patients, dataSource, isLoading,
    processed, setProcessed,
    setUploadedPatients, clearUploadedData,
  } = useData();

  const [uploadPanelOpen, setUploadPanelOpen] = useState(
    () => initialTab === 'upload' || dataSource === 'uploaded',
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedFilename, setProcessedFilename] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const statusCounts = useMemo(() => getStatusCounts(patients, asOf), [patients, asOf]);

  // Sync tab open state when initialTab prop changes
  useEffect(() => {
    if (initialTab === 'upload') setUploadPanelOpen(true);
    else if (initialTab === 'sample') setUploadPanelOpen(false);
  }, [initialTab]);

  // Keep processedFilename in sync with processed and dataSource
  useEffect(() => {
    if (processed) {
      if (dataSource === 'uploaded') {
        setProcessedFilename(prev => prev || 'uploaded cohort');
      } else if (dataSource === 'sample') {
        setProcessedFilename('sanafin-patient-template.csv');
      }
    } else {
      setProcessedFilename('');
    }
  }, [processed, dataSource]);

  function handleSampleUpload() {
    if (dataSource === 'uploaded') {
      clearUploadedData();
    }
    setUploadPanelOpen(false);
    setProcessedFilename('sanafin-patient-template.csv');
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setProcessed(true);  // marks pipeline as run in the store
    }, 600);
  }

  async function handleProcess() {
    if (!uploadedFile) return;
    setParseError(null);
    setProcessing(true);

    try {
      const text = await uploadedFile.text();
      const records = parsePatientCsv(text);

      if (records.length === 0) {
        setParseError('No patient rows found. The file may be empty or missing data.');
        setProcessing(false);
        return;
      }

      const required = PATIENT_CSV_COLUMNS.map(c => c.name);
      const presentCols = Object.keys(records[0]);
      const missing = required.filter(c => !presentCols.includes(c));
      if (missing.length > 0) {
        setParseError(`Missing required columns: ${missing.join(', ')}`);
        setProcessing(false);
        return;
      }

      setUploadedPatients(records);
      setProcessedFilename(uploadedFile.name);
      setTimeout(() => {
        setProcessing(false);
        setProcessed(true);  // marks pipeline as run in the store
      }, 600);
    } catch {
      setParseError('Failed to parse CSV file. Please check the format and try again.');
      setProcessing(false);
    }
  }

  function handleClearAndReset() {
    clearUploadedData();  // resets processed + animationSeen in the store
    setProcessedFilename('');
    setUploadedFile(null);
    setParseError(null);
    setUploadPanelOpen(true);
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
      setParseError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadedFile(e.target.files[0]);
      setParseError(null);
    }
  };

  const sampleTabActive = !uploadPanelOpen && dataSource !== 'uploaded';
  const uploadTabActive = uploadPanelOpen || dataSource === 'uploaded';

  function fmtAsOf(iso: string) {
    const [y, m, d] = iso.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }

  return (
    <div id="upload-section" className="px-6 py-4 p-6">
      <div>
        {/* Left Column: Text and Actions */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Capture Outcomes</h1>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Connect clinical evidence from labs, EHRs, or Smart Scales to verify outcomes under the EDEN framework.
            </p>
          </div>

          {!processed ? (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-1">
                  <Loader2 className="size-3.5 animate-spin text-brand-teal" />
                  <span className="text-[11px] font-semibold">Loading data…</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Compact tabs */}
                  <div className="flex gap-1 p-1 bg-muted/40 rounded-lg border border-foreground/5 glass-panel max-w-[220px]">
                    <button
                      onClick={() => {
                        setUploadPanelOpen(false);
                        if (dataSource === 'uploaded') clearUploadedData();
                      }}
                      className={`flex-1 py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        sampleTabActive
                          ? 'bg-background shadow-xs text-brand-teal border border-foreground/5'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Sample Data
                    </button>
                    <button
                      onClick={() => setUploadPanelOpen(true)}
                      className={`flex-1 py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        uploadTabActive
                          ? 'bg-background shadow-xs text-brand-teal border border-foreground/5'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Upload CSV
                    </button>
                  </div>

                  {/* Sample Dataset Controls */}
                  {!uploadPanelOpen && (
                    <div className="space-y-2.5">
                      <div className="text-[11px] text-muted-foreground font-semibold leading-normal">
                        <p className="text-foreground font-bold">sanafin-patient-template.csv</p>
                        <p className="mt-0.5">{patients.length} mock patient records loaded.</p>
                      </div>
                      <Button
                        size="sm"
                        className="font-bold bg-brand-teal hover:bg-brand-teal/90 glow-teal-sm text-white px-4 h-8 rounded-lg cursor-pointer text-xs"
                        onClick={handleSampleUpload}
                        disabled={processing}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                            Capturing Outcomes…
                          </>
                        ) : (
                          <>
                            <FileText className="size-3.5 mr-1.5" />
                            Capture Sample Cohort
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Upload File Controls */}
                  {uploadPanelOpen && (
                    <div className="space-y-2.5">
                      <div
                        className={`relative border border-dashed rounded-xl p-3 text-center transition-all ${
                          dragActive
                            ? 'border-brand-teal bg-brand-teal/5'
                            : 'border-muted-foreground/25 bg-muted/10 hover:border-brand-teal/30 hover:bg-muted/15'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <Upload className="size-5 mx-auto mb-1 text-brand-teal/80" />
                        <p className="text-[10px] font-bold text-foreground">
                          {uploadedFile ? `Selected: ${uploadedFile.name}` : 'Drag CSV here or click to browse'}
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      {uploadedFile && !parseError && (
                        <div className="flex gap-2 text-[10.5px] items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{uploadedFile.name}</p>
                          </div>
                          <Button
                            size="sm"
                            className="font-bold bg-brand-teal hover:bg-brand-teal/90 glow-teal-sm text-white h-7 px-3 text-[10px] rounded-md cursor-pointer shrink-0"
                            onClick={handleProcess}
                            disabled={processing}
                          >
                            {processing ? (
                              <>
                                <Loader2 className="size-3 mr-1 animate-spin" />
                                Processing…
                              </>
                            ) : (
                              'Process Ingested Evidence'
                            )}
                          </Button>
                        </div>
                      )}

                      {parseError && (
                        <div className="flex gap-2 text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 items-start">
                          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                          <p className="font-semibold leading-tight">{parseError}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px]">
                        <a
                          href="/sanafin-patient-template.csv"
                          download="sanafin-patient-template.csv"
                          className="text-brand-teal hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <Download className="size-3" />
                          Download Template CSV
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle className="size-3.5 text-brand-teal glow-teal-sm animate-pulse" />
                  Evidence Capture Pipeline Active
                </h2>
                <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                  <span className="font-mono text-[9px] bg-muted/65 border border-foreground/5 rounded px-1.5 py-0.5 text-foreground font-semibold">
                    {processedFilename}
                  </span>
                </p>
              </div>

              {asOf && (
                <div className="text-[11px] text-muted-foreground leading-normal font-semibold">
                  <p className="font-bold text-foreground">
                    {statusCounts.total} patients · {statusCounts.completed} completed · {statusCounts.active} active
                  </p>
                  <p className="text-[9.5px] text-muted-foreground/80 mt-0.5">(as of {fmtAsOf(asOf)})</p>
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAndReset}
                  className="font-bold text-[11px] h-7 rounded-md cursor-pointer px-2.5"
                >
                  New Evidence Capture
                </Button>
              </div>
            </div>
          )}

          {/* Data Privacy warning */}
          <div className="flex gap-2 text-[10px] text-muted-foreground/80 items-start pt-2 border-t border-muted-foreground/5">
            <AlertCircle className="size-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="font-medium leading-normal">
              All patient data is de-identified locally. Patient IDs pseudonymised. Encrypted in transit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

