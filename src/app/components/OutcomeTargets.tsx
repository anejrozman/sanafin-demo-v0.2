import OutcomeTargetsPanel from './OutcomeTargetsPanel';

export default function OutcomeTargets() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Outcome Targets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define the clinical goals each participant should meet.
        </p>
      </div>
      <OutcomeTargetsPanel />
    </div>
  );
}
