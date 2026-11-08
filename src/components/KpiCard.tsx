import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  subtitle?: string;
}

export function KpiCard({ label, value, trend, icon, subtitle }: KpiCardProps) {
  return (
    <div className="card p-5 transition-all hover:shadow-cardlg">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-damm-50 text-damm-600">
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-500">{label}</p>
      {subtitle && <p className="mt-2 text-xs text-ink-400">{subtitle}</p>}
    </div>
  );
}
