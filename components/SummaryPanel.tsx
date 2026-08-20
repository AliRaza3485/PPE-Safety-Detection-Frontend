import { Summary } from '@/lib/types';

export default function SummaryPanel({ summary }: { summary: Summary }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">Detection Summary</h3>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            summary.compliant ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {summary.compliant
            ? 'Compliant'
            : `${summary.violation_count} Violation${summary.violation_count === 1 ? '' : 's'}`}
        </span>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <span>
          Total detections: <strong className="text-slate-200">{summary.total}</strong>
        </span>
        {Object.entries(summary.counts).map(([label, count]) => (
          <span key={label}>
            {label}: <strong className="text-slate-200">{count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}