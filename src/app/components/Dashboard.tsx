import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Users, Target, Activity, TrendingDown, Database, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useData } from '../../store/DataContext';
import {
  getCohortSummary, getRulePerformance, getEnrollmentSpan,
  getPatientStatusBreakdown, getAttentionPatients,
} from '../../lib/selectors';

function fmtDate(iso: string) {
  const [y, m] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function fmt(v: number | null, decimals = 1): string {
  return v != null ? v.toFixed(decimals) : '—';
}

export default function Dashboard() {
  const { patients, thresholds, dataSource, isLoading, processed } = useData();

  const summary = useMemo(() => getCohortSummary(patients, thresholds), [patients, thresholds]);
  const rulePerf = useMemo(() => getRulePerformance(patients, thresholds), [patients, thresholds]);
  const span = useMemo(() => getEnrollmentSpan(patients), [patients]);
  const statusBreakdown = useMemo(() => getPatientStatusBreakdown(patients, thresholds), [patients, thresholds]);
  const attentionPatients = useMemo(() => getAttentionPatients(patients, thresholds, 5), [patients, thresholds]);

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

  const kpis: { label: string; value: string; sub: string; icon: React.ElementType }[] = [
    {
      label: 'Total Patients',
      value: summary.total.toString(),
      sub: span ? `avg ${span.avgProgramDays}-day program` : 'in cohort',
      icon: Users,
    },
    {
      label: 'Outcomes Verified',
      value: `${summary.passRate.toFixed(1)}%`,
      sub: `${summary.passed} of ${summary.total} passed`,
      icon: Target,
    },
    {
      label: 'Avg HbA1c Reduction',
      value: summary.avgHba1cChange != null ? `${fmt(summary.avgHba1cChange)} pp` : '—',
      sub: `target ≥ 0.5 pp`,
      icon: Activity,
    },
    {
      label: 'Avg CGM Time-in-Range',
      value: summary.avgCgmTimeInRange != null ? `${fmt(summary.avgCgmTimeInRange)}%` : '—',
      sub: 'target ≥ 70%',
      icon: Activity,
    },
    {
      label: 'Avg Weight Loss',
      value: summary.avgWeightLossPct != null ? `${fmt(summary.avgWeightLossPct)}%` : '—',
      sub: 'target ≥ 5%',
      icon: TrendingDown,
    },
  ];

  const failRate = 100 - summary.passRate;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {span
              ? `${fmtDate(span.earliestEnrollment)} – ${fmtDate(span.latestMeasurement)} · avg ${span.avgProgramDays}-day program`
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground leading-tight pr-2">
                    {kpi.label}
                  </span>
                  <Icon className="size-3.5 text-muted-foreground flex-shrink-0" />
                </div>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Per-target pass rates — takes up 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Target Pass Rates</CardTitle>
            <CardDescription>
              Share of patients meeting each contract threshold
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
            <div className="h-[200px]">
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
                      <Cell
                        key={entry.ruleId}
                        fill={entry.passRate >= 70 ? '#55B4A6' : '#E9A23B'}
                      />
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

        {/* Outcome breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Outcome Breakdown</CardTitle>
            <CardDescription>
              Passed vs failed across all {enabledRules.length} enabled rule{enabledRules.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Stacked ratio bar */}
            <div className="h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-brand-teal transition-all duration-500"
                style={{ width: `${summary.passRate}%` }}
              />
              <div className="bg-brand-amber flex-1" />
            </div>

            {/* Counts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-brand-teal flex-shrink-0" />
                  <span className="text-sm">Passed</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">{summary.passed}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">
                    {summary.passRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-brand-amber flex-shrink-0" />
                  <span className="text-sm">Failed</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">{summary.failed}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">
                    {failRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Pass policy */}
            <div className="border-t pt-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Pass policy:</span>{' '}
                {thresholds.passPolicy === 'all'
                  ? `all ${enabledRules.length} rules`
                  : thresholds.passPolicy === 'any'
                  ? 'any 1 rule'
                  : `≥ ${thresholds.minRulesToPass ?? 1} rules`}
              </p>
              {span && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Cohort window:</span>{' '}
                  {fmtDate(span.earliestEnrollment)} – {fmtDate(span.latestMeasurement)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient status + Needs attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Status</CardTitle>
            <CardDescription>
              How many of the {enabledRules.length} enabled goal{enabledRules.length !== 1 ? 's' : ''} each patient currently meets — independent of pass policy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: `Meeting all ${enabledRules.length} goal${enabledRules.length !== 1 ? 's' : ''}`, count: statusBreakdown.meetingAll, color: 'bg-brand-teal', dot: 'bg-brand-teal' },
              { label: 'Partially meeting goals', count: statusBreakdown.partial, color: 'bg-brand-amber', dot: 'bg-brand-amber' },
              { label: 'Not meeting any goals', count: statusBreakdown.meetingNone, color: 'bg-muted-foreground/30', dot: 'bg-muted-foreground/40' },
            ].map(row => {
              const pct = statusBreakdown.total > 0 ? (row.count / statusBreakdown.total) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`size-2.5 rounded-full ${row.dot} flex-shrink-0`} />
                      <span className="text-sm">{row.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{row.count}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Needs attention */}
        <Card>
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
            <CardDescription>
              {attentionPatients.length > 0
                ? `${attentionPatients.length} patient${attentionPatients.length !== 1 ? 's' : ''} meeting the fewest goals — sorted worst first`
                : 'All patients are meeting every enabled goal'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attentionPatients.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">No patients flagged.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {attentionPatients.map((p, i) => (
                  <div
                    key={p.patientId}
                    className={`flex items-start justify-between py-2.5 ${i < attentionPatients.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-medium">{p.patientId}</span>
                      {p.unmetTargetLabels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.unmetTargetLabels.map(label => (
                            <span
                              key={label}
                              className="text-xs rounded-full border border-brand-amber text-brand-amber px-2 py-0.5"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm ml-4 shrink-0 tabular-nums">
                      <span className="font-medium">{p.rulesMet}</span>
                      <span className="text-muted-foreground"> / {p.rulesTotal}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
