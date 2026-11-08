import type { SurveyStatus } from '@/types';

const config: Record<SurveyStatus, { label: string; classes: string; dot: string }> = {
  active: {
    label: 'Activa',
    classes: 'bg-green-50 text-green-700',
    dot: 'bg-green-500',
  },
  draft: {
    label: 'Esborrany',
    classes: 'bg-ink-100 text-ink-600',
    dot: 'bg-ink-400',
  },
  closed: {
    label: 'Tancada',
    classes: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
  },
};

export function StatusBadge({ status }: { status: SurveyStatus }) {
  const c = config[status];
  return (
    <span className={`badge ${c.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
