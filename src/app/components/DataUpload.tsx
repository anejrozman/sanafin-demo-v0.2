import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle } from 'lucide-react';
import WorkflowView from './WorkflowView';
import InjectionPanel from './InjectionPanel';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { useData } from '../../store/DataContext';
import { getAsOfDate, getStatusCounts } from '../../lib/selectors';

export default function DataUpload() {
  const {
    patients, dataSource, thresholds,
    processed,
    animationSeen, setAnimationSeen,
    clearUploadedData,
  } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const navTab = (location.state as { initialTab?: string } | null)?.initialTab;

  const [processedFilename, setProcessedFilename] = useState<string>(() => {
    if (processed && dataSource === 'uploaded') return 'uploaded cohort';
    if (processed && dataSource === 'sample') return 'sanafin-patient-template.csv';
    return '';
  });
  // Mirrors animationSeen from the store so the View Dashboard button persists across navigation.
  const [animationDone, setAnimationDone] = useState(() => animationSeen);
  const [panelKey, setPanelKey] = useState(0);

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const statusCounts = useMemo(() => getStatusCounts(patients, asOf), [patients, asOf]);

  function handleCohortLoaded(filename: string) {
    setProcessedFilename(filename);
  }

  function handleClearAndReset() {
    clearUploadedData();  // resets processed + animationSeen in the store
    setProcessedFilename('');
    setAnimationDone(false);
    setPanelKey(k => k + 1);  // remount panel to reset its internal state
  }

  function fmtAsOf(iso: string) {
    const [y, m, d] = iso.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1>Data Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
            <InjectionPanel
              key={panelKey}
              initialTab={navTab}
              onCohortLoaded={handleCohortLoaded}
            />
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
                {asOf && (
                  <p className="text-xs text-muted-foreground">
                    {statusCounts.total} patients · {statusCounts.completed} completed · {statusCounts.active} active (as of {fmtAsOf(asOf)})
                  </p>
                )}
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
