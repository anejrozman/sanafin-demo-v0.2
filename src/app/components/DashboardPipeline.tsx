import { Database, ShieldCheck, FileText, CheckCircle, Loader2 } from 'lucide-react';

type NodeStatus = 'idle' | 'processing' | 'done';

export interface VerificationCounts {
  onTrack: number;
  atRisk: number;
  passed: number;
  missed: number;
}

interface DashboardPipelineProps {
  onInjectionClick?: () => void;
  onVerificationClick?: () => void;
  onReportingClick?: () => void;
  injectionStatus?: NodeStatus;
  verificationStatus?: NodeStatus;
  injectionCount?: number;
  verificationCounts?: VerificationCounts;
  reportingStatus?: NodeStatus;
}

function PipelineNode({
  icon: Icon,
  label,
  color,
  onClick,
  status,
  details,
}: {
  icon: React.ElementType;
  label: string;
  color: { ring: string; bg: string; icon: string; text: string };
  onClick?: () => void;
  status?: NodeStatus;
  details?: React.ReactNode;
}) {
  const hasDetails = status === 'done' && details != null;
  const baseClass = `relative flex flex-col items-center rounded-2xl border-2 p-5 w-[200px] h-[200px] overflow-hidden ${color.ring} bg-background shadow-sm`;

  const inner = (
    <>
      {status === 'done' && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="size-4 text-emerald-500" />
        </div>
      )}
      {status === 'processing' && (
        <div className="absolute top-3 right-3">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Icon+label: centered in full card when idle, pushed up when done */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-2.5">
        <div className={`size-12 rounded-xl ${color.bg} flex items-center justify-center`}>
          <Icon className={`size-6 ${color.icon}`} />
        </div>
        <p className={`font-semibold text-sm ${color.text}`}>{label}</p>
      </div>

      {/* Details zone: only rendered when done — its presence pushes icon+label up */}
      {hasDetails && (
        <div className="flex-shrink-0 h-[130px] w-full flex items-start border-t border-border/50 pt-2.5">
          {details}
        </div>
      )}
    </>
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} cursor-pointer hover:shadow-md transition-shadow`}
    >
      {inner}
    </button>
  ) : (
    <div className={baseClass}>{inner}</div>
  );
}

function PipelineConnector() {
  return (
    <div className="flex items-center" style={{ width: 48, flexShrink: 0 }}>
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 0 16 C 12 16, 36 16, 48 16"
          stroke="#55B4A6"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <polygon points="42,11 48,16 42,21" fill="#55B4A6" />
      </svg>
    </div>
  );
}

const STEPS = [
  {
    icon: Database,
    label: 'Data Injection',
    color: { ring: 'border-blue-200', bg: 'bg-blue-50/70', icon: 'text-blue-700', text: 'text-blue-700' },
  },
  {
    icon: ShieldCheck,
    label: 'Verification',
    color: { ring: 'border-violet-200', bg: 'bg-violet-50/70', icon: 'text-violet-700', text: 'text-violet-700' },
  },
  {
    icon: FileText,
    label: 'Reporting',
    color: { ring: 'border-emerald-200', bg: 'bg-emerald-50/70', icon: 'text-emerald-700', text: 'text-emerald-700' },
  },
];

export default function DashboardPipeline({
  onInjectionClick,
  onVerificationClick,
  onReportingClick,
  injectionStatus,
  verificationStatus,
  injectionCount,
  verificationCounts,
  reportingStatus,
}: DashboardPipelineProps = {}) {
  const handlers = [onInjectionClick, onVerificationClick, onReportingClick];
  const statuses: (NodeStatus | undefined)[] = [injectionStatus, verificationStatus, reportingStatus];

  const injectionDetails = injectionCount != null ? (
    <div className="flex flex-col items-center gap-1 w-full pt-1">
      <span className="text-3xl font-bold tabular-nums leading-none text-blue-600">{injectionCount}</span>
      <span className="text-xs text-muted-foreground">patients ingested</span>
    </div>
  ) : undefined;

  const verificationDetails = verificationCounts ? (
    <div className="grid grid-cols-2 gap-x-2 gap-y-3 w-full pt-1">
      {[
        { label: 'On track', count: verificationCounts.onTrack, teal: true },
        { label: 'At risk', count: verificationCounts.atRisk, teal: false },
        { label: 'Passed', count: verificationCounts.passed, teal: true },
        { label: 'Missed', count: verificationCounts.missed, teal: false },
      ].map(item => (
        <div key={item.label} className="flex flex-col items-center gap-0.5">
          <span className={`text-3xl font-bold tabular-nums leading-none ${item.teal ? 'text-brand-teal' : 'text-brand-amber'}`}>
            {item.count}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  ) : undefined;

  const detailsByIndex = [injectionDetails, verificationDetails, undefined];

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Processing pipeline
      </p>
      <div className="flex items-center justify-center py-8 px-6 rounded-2xl border bg-muted gap-0">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <PipelineNode
              {...step}
              onClick={handlers[i]}
              status={statuses[i]}
              details={detailsByIndex[i]}
            />
            {i < STEPS.length - 1 && <PipelineConnector />}
          </div>
        ))}
      </div>
    </div>
  );
}
