"use client";

type MetricCardProps = {
  title: string;
  subtitle?: string;
  value: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
  sparkline?: number[];
  accent?: string;
};

export function MetricCard({
  title,
  subtitle,
  value,
  trend,
  sparkline,
  accent = "from-slate-900/70 to-slate-900/30",
}: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
            {title}
          </p>
          {subtitle ? (
            <p className="text-sm text-slate-300">{subtitle}</p>
          ) : null}
        </div>
        {trend ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              trend.direction === "up"
                ? "bg-emerald-500/10 text-emerald-300"
                : trend.direction === "down"
                  ? "bg-rose-500/10 text-rose-300"
                  : "bg-slate-500/10 text-slate-300"
            }`}
          >
            {trend.value}
          </span>
        ) : null}
      </div>
      <p className="mt-6 text-4xl font-semibold text-white">{value}</p>
      {sparkline ? (
        <div className={`mt-4 h-16 rounded-2xl bg-linear-to-b ${accent} p-2`}>
          <Sparkline data={sparkline} />
        </div>
      ) : null}
    </div>
  );
}

type SparklineProps = {
  data: number[];
};

function Sparkline({ data }: SparklineProps) {
  const max = Math.max(...data);
  const normalized = data.map((value) => value / max);

  return (
    <div className="flex h-full items-end gap-1">
      {normalized.map((value, index) => (
        <span
          key={index}
          className="flex-1 rounded-full bg-white/60"
          style={{ height: `${value * 100}%` }}
        />
      ))}
    </div>
  );
}
