import { useData } from '../../store/DataContext';
import { type OutcomeRule } from '../../lib/thresholds';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Info, Pencil } from 'lucide-react';

export default function OutcomeTargets() {
  const { thresholds, setThresholds } = useData();

  function updateRule(ruleId: string, patch: Partial<OutcomeRule>) {
    setThresholds({
      ...thresholds,
      rules: thresholds.rules.map(r => r.id === ruleId ? { ...r, ...patch } : r),
    });
  }

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
          Default targets are pre-configured. Check a goal to include it in the analysis. A participant must meet all checked goals to count as a verified outcome.
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
                {/* Enabled checkbox */}
                <Checkbox
                  checked={rule.enabled}
                  onCheckedChange={checked => updateRule(rule.id, { enabled: !!checked })}
                  aria-label={`Include ${rule.label} in analysis`}
                />

                {/* Label + metric key */}
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-[120px] flex-1 max-w-[220px]">
                    <Pencil className="size-3 shrink-0 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={rule.label}
                      onChange={e => updateRule(rule.id, { label: e.target.value })}
                      disabled={!rule.enabled}
                      aria-label="Goal name"
                      className="flex-1 font-medium text-sm bg-transparent border-0 border-b border-border focus:border-brand-teal focus:outline-none transition-colors disabled:pointer-events-none"
                    />
                  </div>
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
                    <option value=">">{'>'}</option>
                    <option value=">=">≥</option>
                    <option value="<">{'<'}</option>
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
    </div>
  );
}
