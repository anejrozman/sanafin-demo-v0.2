import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Database, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useData } from '../../store/DataContext';
import {
  getCohortSummary, getRulePerformance, getEnrollmentSpan,
  getAsOfDate, partitionByStatus, getAvgSessionCompletion,
  classifyCohort, getByCategory, getFlaggedSorted,
} from '../../lib/selectors';

function fmtDate(iso: string) {
  const [y, m] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function fmt(v: number | null, decimals = 1): string {
  return v != null ? v.toFixed(decimals) : '—';
}

function SectionHeader({ title, count, accent }: { title: string; count: number; accent: string }) {
  return (
    <div className={`flex items-center gap-3 pb-2 border-b-2 ${accent}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      <span className="text-sm text-muted-foreground tabular-nums">({count})</span>
    </div>
  );
}

function StatTiles({
  count,
  rateLabel,
  rateValue,
  hba1c,
  cgm,
  weight,
  sessions,
}: {
  count: number;
  rateLabel: string;
  rateValue: number;
  hba1c: number | null;
  cgm: number | null;
  weight: number | null;
  sessions: number | null;
}) {
  const tiles = [
    { label: 'Patients', value: count.toString() },
    { label: rateLabel, value: `${rateValue.toFixed(1)}%` },
    { label: 'Avg HbA1c Δ', value: hba1c != null ? `${fmt(hba1c)} pp` : '—' },
    { label: 'Avg CGM TiR', value: cgm != null ? `${fmt(cgm)}%` : '—' },
    { label: 'Avg Weight Loss', value: weight != null ? `${fmt(weight)}%` : '—' },
    { label: 'Avg Sessions', value: sessions != null ? `${sessions.toFixed(0)}%` : '—' },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {tiles.map(t => (
        <div key={t.label} className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t.label}</p>
          <p className="text-lg font-bold mt-0.5">{t.value}</p>
        </div>
      ))}
    </div>
  );
}

function MetricChips({ ruleResults }: {
  ruleResults: { ruleId: string; label: string; actual: number | null; unit: string; passed: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {ruleResults.map(r => {
        const val = r.actual != null
          ? `${Number.isInteger(r.actual) ? r.actual : r.actual.toFixed(1)} ${r.unit}`
          : '—';
        return (
          <span
            key={r.ruleId}
            className={`text-xs rounded-full px-2 py-0.5 border font-medium ${
              r.passed
                ? 'border-brand-teal text-brand-teal bg-brand-teal/8'
                : 'border-brand-amber text-brand-amber bg-brand-amber/8'
            }`}
          >
            {r.label}: {val}
          </span>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { patients, thresholds, dataSource, isLoading, processed } = useData();

  const asOf = useMemo(() => getAsOfDate(patients) ?? '', [patients]);
  const { completed, active } = useMemo(() => partitionByStatus(patients, asOf), [patients, asOf]);

  const summary      = useMemo(() => getCohortSummary(completed, thresholds), [completed, thresholds]);
  const activeSummary = useMemo(() => getCohortSummary(active, thresholds), [active, thresholds]);
  const rulePerf     = useMemo(() => getRulePerformance(completed, thresholds), [completed, thresholds]);
  const span         = useMemo(() => getEnrollmentSpan(patients), [patients]);
  const avgCompletedSessions = useMemo(() => getAvgSessionCompletion(completed), [completed]);
  const avgActiveSessions    = useMemo(() => getAvgSessionCompletion(active), [active]);

  const classified   = useMemo(() => classifyCohort(patients, thresholds, asOf), [patients, thresholds, asOf]);
  const cats         = useMemo(() => getByCategory(classified), [classified]);
  const flaggedSorted = useMemo(() => getFlaggedSorted(classified), [classified]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Loading cohort data…</p>
        </div>
      </div>
    );
  }

  if (!processed) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <Database className="size-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-semibold">No cohort processed yet</p>
            <p className="text-sm text-muted-foreground">
              Complete these two steps to see outcome results here.
            </p>
          </div>
          <div className="w-full text-left space-y-3">
            <div className="flex gap-3">
              <span className="size-5 rounded-full bg-brand-teal text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium">Upload data or use the sample dataset</p>
                <p className="text-xs text-muted-foreground">Select a patient cohort on the Data Upload page.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="size-5 rounded-full bg-brand-teal text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-medium">Run the pipeline</p>
                <p className="text-xs text-muted-foreground">Click "Start with sample data" or "Process Upload" to verify outcomes.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Outcome targets are pre-configured.{' '}
            <Link to="/targets" className="underline underline-offset-2">Outcome Targets</Link>
            {' '}lets you customise them at any time.
          </p>
          <Button asChild>
            <Link to="/upload">Go to Data Upload</Link>
          </Button>
        </div>
      </div>
    );
  }

  const enabledRules = thresholds.rules.filter(r => r.enabled);
  const failRate = 100 - summary.passRate;
  const onTrackRate = active.length > 0 ? (cats.onTrack.length / active.length) * 100 : 0;
  const flaggedRate = 100 - onTrackRate;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {span
              ? `${fmtDate(span.earliestEnrollment)} – ${fmtDate(span.latestMeasurement)} · ${patients.length} patients · ${completed.length} completed · ${active.length} active`
              : 'Cohort outcome verification summary'}
          </p>
        </div>
        <Badge
          variant={dataSource === 'uploaded' ? 'default' : 'outline'}
          className="mt-1 flex-shrink-0"
        >
          {dataSource === 'uploaded' ? 'Uploaded data' : 'Sample data'}
        </Badge>
      </div>

      {/* ── COMPLETED TREATMENT ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        <SectionHeader title="Completed treatment" count={completed.length} accent="border-brand-teal" />

        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patients have completed treatment yet.</p>
        ) : (
          <>
            <StatTiles
              count={completed.length}
              rateLabel="Pass rate"
              rateValue={summary.passRate}
              hba1c={summary.avgHba1cChange}
              cgm={summary.avgCgmTimeInRange}
              weight={summary.avgWeightLossPct}
              sessions={avgCompletedSessions}
            />

            {/* Outcome breakdown + target pass-rate chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Target Pass Rates</CardTitle>
                  <CardDescription>
                    Share of completed patients meeting each threshold
                    {rulePerf.length > 0 && (
                      <span className="ml-1">
                        — bottleneck:{' '}
                        <span className="font-medium text-foreground">
                          {rulePerf.reduce((min, r) => r.passRate < min.passRate ? r : min).label}
                        </span>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rulePerf}
                        layout="vertical"
                        margin={{ left: 8, right: 40, top: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={v => `${v}%`}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={150}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(v) => [`${(v as number).toFixed(1)}%`, 'Pass rate']}
                          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        />
                        <Bar dataKey="passRate" radius={[0, 4, 4, 0]} maxBarSize={32}>
                          {rulePerf.map(entry => (
                            <Cell key={entry.ruleId} fill={entry.passRate >= 70 ? '#55B4A6' : '#E9A23B'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Teal = ≥ 70% pass rate · Amber = below 70%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outcome Breakdown</CardTitle>
                  <CardDescription>
                    Pass vs fail · {enabledRules.length} rule{enabledRules.length !== 1 ? 's' : ''} · completed patients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="h-3 rounded-full overflow-hidden flex">
                    <div className="bg-brand-teal transition-all duration-500" style={{ width: `${summary.passRate}%` }} />
                    <div className="bg-brand-amber flex-1" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Pass', count: summary.passed, rate: summary.passRate, color: 'bg-brand-teal' },
                      { label: 'Fail', count: summary.failed, rate: failRate, color: 'bg-brand-amber' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`size-2.5 rounded-full ${row.color} flex-shrink-0`} />
                          <span className="text-sm">{row.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">{row.count}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">{row.rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Pass policy:</span>{' '}
                      {thresholds.passPolicy === 'all'
                        ? `all ${enabledRules.length} rules`
                        : thresholds.passPolicy === 'any'
                        ? 'any 1 rule'
                        : `≥ ${thresholds.minRulesToPass ?? 1} rules`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Needs review: failed completed patients */}
            <Card>
              <CardHeader>
                <CardTitle>Needs Review</CardTitle>
                <CardDescription>
                  {cats.fail.length > 0
                    ? `${cats.fail.length} completed patient${cats.fail.length !== 1 ? 's' : ''} that did not meet outcome targets`
                    : 'All completed patients met their outcome targets'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cats.fail.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No patients to review.</p>
                ) : (
                  <div className="overflow-auto max-h-[280px]">
                    <div className="space-y-0">
                      {cats.fail.map((c, i) => (
                        <div
                          key={c.patient.patient_id}
                          className={`flex items-start justify-between py-2.5 ${i < cats.fail.length - 1 ? 'border-b' : ''}`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-sm font-medium">{c.patient.patient_id}</span>
                            <MetricChips ruleResults={c.evaluation.ruleResults} />
                          </div>
                          <Badge className="bg-brand-amber text-white text-xs ml-4 shrink-0">Fail</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── ACTIVE (IN TREATMENT) ────────────────────────────────────────────── */}
      <div className="space-y-5">
        <SectionHeader title="Active (in treatment)" count={active.length} accent="border-border" />

        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patients currently in treatment.</p>
        ) : (
          <>
            <StatTiles
              count={active.length}
              rateLabel="On-track rate"
              rateValue={onTrackRate}
              hba1c={activeSummary.avgHba1cChange}
              cgm={activeSummary.avgCgmTimeInRange}
              weight={activeSummary.avgWeightLossPct}
              sessions={avgActiveSessions}
            />

            {/* On-track vs flagged breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status Breakdown</CardTitle>
                <CardDescription>
                  Active patients currently meeting vs not yet meeting targets — mid-program snapshot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div className="border border-brand-teal/50 bg-brand-teal/20 transition-all duration-500 rounded-l-full" style={{ width: `${onTrackRate}%` }} />
                  <div className="border border-brand-amber/50 bg-brand-amber/20 flex-1 rounded-r-full" />
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'On track', count: cats.onTrack.length, rate: onTrackRate, dotColor: 'border-brand-teal bg-brand-teal/20', textColor: 'text-brand-teal' },
                    { label: 'Flagged', count: cats.flagged.length, rate: flaggedRate, dotColor: 'border-brand-amber bg-brand-amber/20', textColor: 'text-brand-amber' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`size-2.5 rounded-full border ${row.dotColor} flex-shrink-0`} />
                        <span className="text-sm">{row.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{row.count}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{row.rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground border-t pt-3">
                  "On track" = currently meeting all enabled targets. Not a projection.
                </p>
              </CardContent>
            </Card>

            {/* Flagged active patients — sorted nearest completion first */}
            <Card>
              <CardHeader>
                <CardTitle>Flagged Patients</CardTitle>
                <CardDescription>
                  {flaggedSorted.length > 0
                    ? `${flaggedSorted.length} active patient${flaggedSorted.length !== 1 ? 's' : ''} not yet meeting targets — sorted by days remaining (nearest first)`
                    : 'All active patients are currently meeting their targets'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedSorted.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No flagged patients.</p>
                ) : (
                  <div className="overflow-auto max-h-[360px]">
                    <div className="space-y-0">
                      {flaggedSorted.map((c, i) => {
                        const sessionPct = c.patient.total_sessions > 0
                          ? Math.round((c.patient.sessions_attended / c.patient.total_sessions) * 100)
                          : null;
                        return (
                          <div
                            key={c.patient.patient_id}
                            className={`py-3 ${i < flaggedSorted.length - 1 ? 'border-b' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <span className="font-mono text-sm font-medium">{c.patient.patient_id}</span>
                                <MetricChips ruleResults={c.evaluation.ruleResults} />
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-right">
                                {sessionPct != null && (
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    {sessionPct}% sessions
                                  </span>
                                )}
                                <span className="text-sm font-medium tabular-nums">
                                  {c.daysRemaining != null ? `${c.daysRemaining}d` : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
