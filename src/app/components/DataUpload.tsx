import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import WorkflowView from './WorkflowView';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { useData } from '../../store/DataContext';
import { parsePatientCsv } from '../../lib/parsePatientCsv';
import { PATIENT_CSV_COLUMNS } from '../../lib/schema';

export default function DataUpload() {
  const {
    patients, dataSource, thresholds, isLoading,
    processed, setProcessed,
    animationSeen, setAnimationSeen,
    setUploadedPatients, clearUploadedData,
  } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const navTab = (location.state as { initialTab?: string } | null)?.initialTab;

  const [uploadPanelOpen, setUploadPanelOpen] = useState(
    () => navTab === 'upload' || dataSource === 'uploaded',
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  // Derive a display filename for the WorkflowView header when restoring from localStorage.
  const [processedFilename, setProcessedFilename] = useState<string>(() => {
    if (processed && dataSource === 'uploaded') return 'uploaded cohort';
    if (processed && dataSource === 'sample') return 'sanafin-patient-template.csv';
    return '';
  });
  const [parseError, setParseError] = useState<string | null>(null);
  // Mirrors animationSeen from the store so the View Dashboard button persists across navigation.
  const [animationDone, setAnimationDone] = useState(() => animationSeen);

  // React Router doesn't remount when navigating to the same route, so the useState
  // initializer won't re-run. This effect re-applies the tab intent on every navigation.
  useEffect(() => {
    if (navTab === 'upload') setUploadPanelOpen(true);
    else if (navTab === 'sample') setUploadPanelOpen(false);
  }, [navTab]);

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
    setUploadPanelOpen(false);
    setAnimationDone(false);
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1>Data Upload</h1>
          <p className="text-muted-foreground mt-1">
            Upload participant data — SanaFin verifies outcomes against outcome targets.
          </p>
        </div>
        {processed && (
          <Button variant="outline" size="sm" onClick={handleClearAndReset}>
            {dataSource === 'uploaded' ? 'Clear uploaded data' : 'New Upload'}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!processed ? (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Data Privacy & Security</AlertTitle>
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
                          <p className="font-medium text-foreground">Sample cohort loaded</p>
                          <p className="text-muted-foreground mt-1">
                            {patients.length} patients · sanafin-patient-template.csv
                          </p>
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
          </motion.div>
        ) : (
          <motion.div
            key="workflow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-emerald-500" />
                  Cohort processing started
                </CardTitle>
                <CardDescription>
                  <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">{processedFilename}</span>
                  {' '}— watching pipeline run
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowView
                  filename={processedFilename}
                  patients={patients}
                  thresholds={thresholds}
                  initiallyComplete={animationSeen}
                  onComplete={() => {
                    setAnimationDone(true);
                    setAnimationSeen(true);
                  }}
                />
                <AnimatePresence>
                  {animationDone && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-center mt-8"
                    >
                      <Button onClick={() => navigate('/')}>
                        View Dashboard
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
