import { useData } from '../../store/DataContext';
import { type OutcomeRule } from '../../lib/thresholds';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Info } from 'lucide-react';

export default function OutcomeTargets() {
  const { thresholds, setThresholds } = useData();

  function updateRule(ruleId: string, patch: Partial<OutcomeRule>) {
    setThresholds({
      ...thresholds,
      rules: thresholds.rules.map(r => r.id === ruleId ? { ...r, ...patch } : r),
    });
  }

  const enabledCount = thresholds.rules.filter(r => r.enabled).length;

  const policyDescription = thresholds.passPolicy === 'all'
    ? `Every participant must meet all ${enabledCount} enabled goal${enabledCount !== 1 ? 's' : ''} to count as a verified outcome.`
    : thresholds.passPolicy === 'any'
    ? `A participant meets the bar by reaching at least one of the ${enabledCount} enabled goals.`
    : `A participant must meet at least ${thresholds.minRulesToPass ?? 1} of the ${enabledCount} enabled goals.`;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Outcome Targets</h1>
        <p className="text-muted-foreground mt-1">
          Define the clinical goals each participant should meet.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="size-4 mt-0.5 shrink-0 text-brand-teal" />
        <span>
          Default targets are pre-configured.
        </span>
      </div>

      {/* Clinical goals */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Clinical Goals</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Each goal defines a measurable threshold for participant outcomes.
          </p>
        </div>

        {thresholds.rules.map(rule => (
          <Card key={rule.id} className={`transition-opacity ${rule.enabled ? '' : 'opacity-60'}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                {/* Enabled toggle */}
                <button
                  role="switch"
                  aria-checked={rule.enabled}
                  aria-label={`Toggle ${rule.label}`}
                  onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none ${
                    rule.enabled ? 'bg-brand-teal' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                      rule.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Label + metric key */}
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <input
                    type="text"
                    value={rule.label}
                    onChange={e => updateRule(rule.id, { label: e.target.value })}
                    disabled={!rule.enabled}
                    aria-label="Goal name"
                    className="min-w-[120px] flex-1 max-w-[220px] font-medium text-sm bg-transparent border-0 border-b border-transparent hover:border-border focus:border-brand-teal focus:outline-none transition-colors disabled:pointer-events-none"
                  />
                  <code className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                    {rule.metric}
                  </code>
                </div>

                {/* Operator + value + unit */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={rule.operator}
                    onChange={e => updateRule(rule.id, { operator: e.target.value as OutcomeRule['operator'] })}
                    disabled={!rule.enabled}
                    className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value=">=">≥</option>
                    <option value="<=">≤</option>
                  </select>
                  <input
                    type="number"
                    value={rule.value}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v >= 0) updateRule(rule.id, { value: v });
                    }}
                    disabled={!rule.enabled}
                    step="0.1"
                    min="0"
                    aria-label="Target value"
                    className="w-20 rounded-md border bg-background px-2 py-1 text-sm text-right disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-muted-foreground w-12 shrink-0">{rule.unit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pass policy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pass Policy</CardTitle>
          <CardDescription>
            How many of the {enabledCount} enabled goal{enabledCount !== 1 ? 's' : ''} must a participant meet to count as a verified outcome?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(['all', 'any', 'count'] as const).map(policy => (
              <button
                key={policy}
                onClick={() => setThresholds({ ...thresholds, passPolicy: policy })}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  thresholds.passPolicy === policy
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {policy === 'all' ? 'All goals' : policy === 'any' ? 'Any goal' : 'Minimum count'}
              </button>
            ))}
          </div>

          {thresholds.passPolicy === 'count' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Minimum goals to meet:</span>
              <input
                type="number"
                value={thresholds.minRulesToPass ?? 1}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1 && v <= enabledCount) {
                    setThresholds({ ...thresholds, minRulesToPass: v });
                  }
                }}
                min={1}
                max={enabledCount || 1}
                className="w-16 rounded-md border bg-background px-2 py-1 text-sm"
              />
              <span className="text-sm text-muted-foreground">of {enabledCount}</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
            {policyDescription}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
