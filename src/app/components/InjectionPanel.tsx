import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { parsePatientCsv } from '../../lib/parsePatientCsv';
import { PATIENT_CSV_COLUMNS } from '../../lib/schema';
import { getAsOfDate, getStatusCounts } from '../../lib/selectors';

interface InjectionPanelProps {
  initialTab?: string;
  onCohortLoaded?: (filename: string) => void;
  onRequestClose?: () => void;
}

export default function InjectionPanel({ initialTab, onCohortLoaded }: InjectionPanelProps) {
  const {
    patients, dataSource, isLoading,
    setUploadedPatients, clearUploadedData, setProcessed,
  } = useData();

  const [uploadPanelOpen, setUploadPanelOpen] = useState(
    () => initialTab === 'upload' || dataSource === 'uploaded',
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const statusCounts = useMemo(() => getStatusCounts(patients, asOf), [patients, asOf]);

  // Re-apply tab intent on every navigation (router doesn't remount same route).
  useEffect(() => {
    if (initialTab === 'upload') setUploadPanelOpen(true);
    else if (initialTab === 'sample') setUploadPanelOpen(false);
  }, [initialTab]);

  function handleSampleUpload() {
    if (dataSource === 'uploaded') clearUploadedData();
    setUploadPanelOpen(false);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setProcessed(true);
      onCohortLoaded?.('sanafin-patient-template.csv');
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
      const filename = uploadedFile.name;
      setTimeout(() => {
        setProcessing(false);
        setProcessed(true);
        onCohortLoaded?.(filename);
      }, 600);
    } catch {
      setParseError('Failed to parse CSV file. Please check the format and try again.');
      setProcessing(false);
    }
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
    <>
      <Alert>
        <AlertCircle className="size-4" />
        <AlertTitle>Data Privacy &amp; Security</AlertTitle>
        <AlertDescription>
          All patient data must be de-identified. Patient IDs should be pseudonymised.
          Data is encrypted in transit and at rest.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload Participant Outcome Data</CardTitle>
          <CardDescription>
            CSV with one row per patient, download template for required format. You can use the sample dataset or upload your own.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading sample data…</span>
            </div>
          ) : (
            <>
              {/* Data source chooser */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => {
                    setUploadPanelOpen(false);
                    if (dataSource === 'uploaded') clearUploadedData();
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    sampleTabActive
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Use sample dataset
                </button>
                <button
                  onClick={() => setUploadPanelOpen(true)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    uploadTabActive
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Upload your own dataset
                </button>
              </div>

              {/* Sample panel */}
              {!uploadPanelOpen && (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                    <p className="text-sm font-medium text-foreground">Sample cohort loaded</p>
                    <p className="text-muted-foreground mt-1">
                      {patients.length} patients · sanafin-patient-template.csv
                    </p>
                    {asOf && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {statusCounts.completed} completed · {statusCounts.active} active (as of {fmtAsOf(asOf)})
                      </p>
                    )}
                    {dataSource === 'uploaded' && (
                      <p className="text-amber-600 mt-1 text-xs">
                        Currently using uploaded data. Switch to sample to clear it.
                      </p>
                    )}
                  </div>
                  <Button onClick={handleSampleUpload} disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <FileText className="size-4 mr-2" />
                        Start with sample data
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Upload panel */}
              {uploadPanelOpen && (
                <div className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">
                      {uploadedFile ? `Selected: ${uploadedFile.name}` : 'Drag and drop CSV file here'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">or</p>
                    <div className="relative inline-block">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline">Browse Files</Button>
                    </div>
                  </div>

                  {uploadedFile && !parseError && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="size-4 text-green-600" />
                      <AlertTitle>File ready</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                          {uploadedFile.name}
                        </span>
                        <Button size="sm" className="ml-4" onClick={handleProcess} disabled={processing}>
                          {processing ? (
                            <>
                              <Loader2 className="size-4 mr-2 animate-spin" />
                              Processing…
                            </>
                          ) : (
                            <>
                              <Upload className="size-4 mr-2" />
                              Process Upload
                            </>
                          )}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {parseError && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Upload Error</AlertTitle>
                      <AlertDescription>{parseError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button variant="outline" asChild>
                  <a href="/sanafin-patient-template.csv" download="sanafin-patient-template.csv">
                    <Download className="size-4 mr-2" />
                    Download CSV Template
                  </a>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
