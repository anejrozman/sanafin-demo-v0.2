import { useEffect, useRef, useState } from 'react';
import { useData } from '../../store/DataContext';
import { type OutcomeRule } from '../../lib/thresholds';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Check, Info, Loader2, Pencil } from 'lucide-react';

type SaveStatus = 'saved' | 'saving';

function AutosaveIndicator({ status, justNow }: { status: SaveStatus; justNow: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs mt-1">
      {status === 'saving' ? (
        <>
          <Loader2 className="size-3 animate-spin text-brand-amber" />
          <span className="text-brand-amber font-medium">Saving targets…</span>
        </>
      ) : (
        <>
          <Check className="size-3 text-brand-teal" />
          <span className="text-brand-teal font-semibold">All changes autosaved</span>
        </>
      )}
    </div>
  );
}

interface OutcomeTargetsProps {
  onConfirm?: () => void;
}

export default function OutcomeTargets({ onConfirm }: OutcomeTargetsProps = {}) {
  const { thresholds, setThresholds } = useData();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [justNow, setJustNow] = useState(false);
  const didMountRef = useRef(false);
  const justNowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setSaveStatus('saving');
    setJustNow(false);
    if (justNowTimerRef.current) clearTimeout(justNowTimerRef.current);

    const saveTimer = setTimeout(() => {
      setSaveStatus('saved');
      setJustNow(true);
      justNowTimerRef.current = setTimeout(() => setJustNow(false), 10_000);
    }, 800);

    return () => clearTimeout(saveTimer);
  }, [thresholds]);

  function updateRule(ruleId: string, patch: Partial<OutcomeRule>) {
    setThresholds({
      ...thresholds,
      rules: thresholds.rules.map(r => r.id === ruleId ? { ...r, ...patch } : r),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">EDEN Contract Targets</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
            Define the clinical verification thresholds for the smart contract.
          </p>
        </div>
        <AutosaveIndicator status={saveStatus} justNow={justNow} />
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-xs font-semibold text-brand-teal/90 shadow-xs glass-panel">
        <Info className="size-4 mt-0.5 shrink-0 text-brand-teal glow-teal-sm" />
        <span>
          A participant must meet all checked goals in the EDEN checklist below to verify the outcome and release the associated performance escrow. Unchecked goals will not be audited.
        </span>
      </div>

      {/* Pass Policy checklist */}
      <div className="rounded-xl border border-foreground/5 bg-background/50 p-4 space-y-3 glass-panel">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Pass Policy checklist: Select targets to count
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {thresholds.rules.map(rule => (
            <label key={rule.id} className="flex items-center gap-2.5 text-xs font-bold cursor-pointer hover:text-brand-teal transition-all text-foreground">
              <Checkbox
                checked={rule.enabled}
                onCheckedChange={checked => updateRule(rule.id, { enabled: !!checked })}
                className="rounded border-foreground/20 text-brand-teal focus:ring-brand-teal"
              />
              <span>{rule.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clinical goals configuration */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/80">Configure EDEN Target Thresholds</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
            Set the actuarial logic and evidence thresholds for automated escrow settlement.
          </p>
        </div>

        {thresholds.rules.map(rule => (
          <Card key={rule.id} className={`transition-all duration-300 border border-foreground/5 rounded-xl glass-panel ${
            rule.enabled ? 'border-brand-teal/30 bg-background/60 shadow-xs' : 'opacity-50 bg-muted/10'
          }`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-4 w-full flex-wrap sm:flex-nowrap">
                {/* Left Side: Status Icon + Name + Metric code */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`size-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    rule.enabled 
                      ? 'border-brand-teal bg-brand-teal/10 text-brand-teal glow-teal-sm' 
                      : 'border-muted-foreground/35 text-muted-foreground/50'
                  }`}>
                    {rule.enabled ? <Check className="size-3.5 stroke-[3px]" /> : <span className="text-[10px] font-bold">•</span>}
                  </div>

                  <div className="flex items-center gap-1.5 min-w-[120px] flex-1 max-w-[220px]">
                    <Pencil className="size-3 shrink-0 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={rule.label}
                      onChange={e => updateRule(rule.id, { label: e.target.value })}
                      disabled={!rule.enabled}
                      aria-label="Goal name"
                      className="flex-1 font-bold text-sm bg-transparent border-0 border-b border-border/80 focus:border-brand-teal focus:outline-none transition-colors disabled:pointer-events-none text-foreground"
                    />
                  </div>
                  <code className="text-[10px] font-bold text-muted-foreground bg-muted border border-foreground/5 rounded px-1.5 py-0.5 shrink-0">
                    {rule.metric}
                  </code>
                </div>

                {/* Right Side: Logic Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={rule.operator}
                    onChange={e => updateRule(rule.id, { operator: e.target.value as OutcomeRule['operator'] })}
                    disabled={!rule.enabled}
                    className="rounded-md border border-foreground/10 bg-background px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                  >
                    <option value=">=">≥</option>
                    <option value="<=">≤</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="=">=</option>
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
                    className="w-20 rounded-md border border-foreground/10 bg-background px-2.5 py-1 text-xs font-bold text-right focus:ring-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                  />
                  <span className="text-xs font-bold text-muted-foreground w-12 shrink-0 pl-1">{rule.unit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-3 border-t border-foreground/5 space-y-4">
        <p className="text-[10px] text-muted-foreground text-center font-semibold">
          Changes to outcome targets are automatically saved and re-applied to the dashboard in real-time.
        </p>
        {onConfirm && (
          <button
            onClick={onConfirm}
            className="w-full rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold py-3 text-sm transition-all shadow-lg"
          >
            Set outcome targets
          </button>
        )}
      </div>
    </div>
  );
}

