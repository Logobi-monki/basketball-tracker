import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: ReactNode;
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-5 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {subtitle && <span className="text-sm font-mono text-muted-foreground">{subtitle}</span>}
      </div>
      {trend && (
        <div className={`mt-2 flex items-center text-xs font-medium ${trend.value >= 0 ? "text-green-500" : "text-destructive"}`}>
          <span>{trend.value >= 0 ? "+" : ""}{trend.value}</span>
          <span className="ml-1 text-muted-foreground font-mono">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
