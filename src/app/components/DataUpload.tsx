import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import WorkflowView from './WorkflowView';
import { motion, AnimatePresence } from 'motion/react';

interface DataUploadProps {
  triggerSampleUpload?: boolean;
  onSampleConsumed?: () => void;
}

export default function DataUpload({ triggerSampleUpload, onSampleConsumed }: DataUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [processedFilename, setProcessedFilename] = useState('');

  // Trigger sample upload when the welcome modal's CTA lands us here
  useEffect(() => {
    if (triggerSampleUpload && !processed) {
      handleSampleUpload();
      onSampleConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSampleUpload]);

  function handleSampleUpload() {
    const sampleName = 'oviva_Q2_2026_sample_cohort.csv';
    setProcessing(true);
    setProcessedFilename(sampleName);
    setTimeout(() => {
      setProcessing(false);
      setProcessed(true);
    }, 600);
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
    if (e.dataTransfer.files?.[0]) setUploadedFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
  };

  const handleProcess = () => {
    const name = uploadedFile?.name ?? 'cohort_data.csv';
    setProcessing(true);
    setProcessedFilename(name);
    setTimeout(() => {
      setProcessing(false);
      setProcessed(true);
    }, 600);
  };

  const handleReset = () => {
    setProcessed(false);
    setProcessedFilename('');
    setUploadedFile(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1>Data Upload</h1>
          <p className="text-muted-foreground mt-1">
            Upload Oviva participant data — SanaFin verifies outcomes and releases escrow automatically.
          </p>
        </div>
        {processed && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            New Upload
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
                Data is encrypted in transit and at rest (Swiss data residency).
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Upload Participant Outcome Data</CardTitle>
                <CardDescription>
                  CSV with one row per patient — HbA1c, CGM time-in-range, and date columns required
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {uploadedFile && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="size-4 text-green-600" />
                    <AlertTitle>File ready</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)</span>
                      <Button size="sm" className="ml-4" onClick={handleProcess} disabled={processing}>
                        <Upload className="size-4 mr-2" />
                        {processing ? 'Processing…' : 'Process Upload'}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={handleSampleUpload} disabled={processing}>
                    <FileText className="size-4 mr-2" />
                    {processing ? 'Loading…' : 'Use Sample Dataset'}
                  </Button>
                  <Button variant="outline">
                    <Download className="size-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>
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
                <WorkflowView filename={processedFilename} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
