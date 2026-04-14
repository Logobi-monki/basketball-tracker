import { useParams, Link } from "wouter";
import {
  useGetPlayer,
  useGetPlayerStats,
  useGetPlayerAnalytics,
  useGetPlayerTrend,
  useGetVerticalJumpHistory,
  useAddVerticalJump,
  getGetVerticalJumpHistoryQueryKey,
} from "@workspace/api-client-react";
import { StatCard } from "@/components/stat-card";
import {
  ArrowLeft, Target, Activity, Shield, TrendingUp, Zap, Clock,
  AlertTriangle, ChevronUp, Plus, X,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Area, AreaChart,
} from "recharts";
import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

// ── Vertical jump input form ──────────────────────────────────────────────────
function VerticalJumpForm({
  playerId,
  onClose,
}: {
  playerId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const addJump = useAddVerticalJump();

  const [unit, setUnit] = useState<"inches" | "cm">("inches");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal <= 0) {
      setError("Enter a valid measurement");
      return;
    }
    setError("");

    const body =
      unit === "inches"
        ? { valueInches: numVal, date, notes: notes || undefined }
        : { valueCm: numVal, date, notes: notes || undefined };

    addJump.mutate(
      { id: playerId, data: body },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetVerticalJumpHistoryQueryKey(playerId),
          });
          onClose();
        },
        onError: () => setError("Failed to save. Try again."),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 bg-background p-1 rounded border border-card-border w-fit">
        {(["inches", "cm"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${
              unit === u
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {u.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Jump Height ({unit})
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={unit === "inches" ? "e.g. 28.5" : "e.g. 72.4"}
            className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Pre-game test, post-training, etc."
          className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive font-mono">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={addJump.isPending}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          {addJump.isPending ? "SAVING..." : "SAVE ENTRY"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-card-border transition-colors"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function VertJumpTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-card-border rounded p-3 text-xs font-mono shadow-lg">
      <div className="text-muted-foreground mb-1">
        {(() => { try { return format(new Date(label), "MMM dd, yyyy"); } catch { return label; } })()}
      </div>
      <div className="text-primary font-bold text-base">{payload[0].value}" <span className="text-muted-foreground text-xs">({d.valueCm} cm)</span></div>
      {d.notes && <div className="text-muted-foreground mt-1 italic">{d.notes}</div>}
    </div>
  );
}

// ── Main player profile ───────────────────────────────────────────────────────
export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const playerId = parseInt(id, 10);

  const { data: player, isLoading: loadingPlayer } = useGetPlayer(playerId, {
    query: { enabled: !!playerId },
  });
  const { data: analytics, isLoading: loadingAnalytics } = useGetPlayerAnalytics(playerId, {
    query: { enabled: !!playerId },
  });
  const { data: trend, isLoading: loadingTrend } = useGetPlayerTrend(playerId, {
    query: { enabled: !!playerId },
  });
  const { data: stats, isLoading: loadingStats } = useGetPlayerStats(playerId, {
    query: { enabled: !!playerId },
  });
  const { data: vertHistory, isLoading: loadingVert } = useGetVerticalJumpHistory(playerId, {
    query: { enabled: !!playerId },
  });

  const [chartMetric, setChartMetric] = useState<
    "points" | "assists" | "rebounds" | "efficiencyRating"
  >("points");
  const [showVertForm, setShowVertForm] = useState(false);

  if (loadingPlayer)
    return (
      <div className="p-8 text-center animate-pulse font-mono text-muted-foreground">
        LOADING PLAYER DATA...
      </div>
    );
  if (!player)
    return (
      <div className="p-8 text-center text-destructive font-mono">
        PLAYER NOT FOUND
      </div>
    );

  // Derived vert jump stats
  const vertData = (vertHistory ?? []).map((e) => ({
    ...e,
    valueInches: +e.valueInches.toFixed(2),
    valueCm: +e.valueCm.toFixed(1),
  }));
  const personalBest = vertData.length
    ? Math.max(...vertData.map((e) => e.valueInches))
    : null;
  const latestVert = vertData.at(-1)?.valueInches ?? null;
  const firstVert = vertData.at(0)?.valueInches ?? null;
  const improvement =
    firstVert !== null && latestVert !== null
      ? +(latestVert - firstVert).toFixed(2)
      : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono uppercase tracking-wider mb-6">
        <Link
          href="/players"
          className="hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO ROSTER
        </Link>
        <span>/</span>
        <span className="text-foreground">PLAYER_{player.id}</span>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-card-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary text-primary-foreground text-xs font-black px-2 py-1 rounded uppercase tracking-widest">
              {player.position}
            </span>
            <span className="text-3xl font-black text-muted-foreground/30">
              #{player.number}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
            {player.name}
          </h1>
          <p className="text-muted-foreground mt-1 font-mono tracking-wider">
            {player.team} | {player.season}
          </p>
        </div>

        {analytics && (
          <div className="flex gap-4">
            <div className="bg-card border border-card-border rounded px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Consistency
              </div>
              <div className="text-2xl font-bold font-mono text-primary">
                {analytics.consistencyScore.toFixed(0)}
              </div>
            </div>
            <div className="bg-card border border-card-border rounded px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Fatigue Idx
              </div>
              <div
                className={`text-2xl font-bold font-mono ${
                  analytics.fatigueIndex > 80
                    ? "text-destructive"
                    : "text-green-500"
                }`}
              >
                {analytics.fatigueIndex.toFixed(0)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI cards ── */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-card rounded-lg border border-card-border"
            />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Points / G"
            value={analytics.ppg.toFixed(1)}
            subtitle="PPG"
            icon={<Target className="w-4 h-4" />}
          />
          <StatCard
            title="Assists / G"
            value={analytics.apg.toFixed(1)}
            subtitle="APG"
            icon={<Activity className="w-4 h-4" />}
          />
          <StatCard
            title="Rebounds / G"
            value={analytics.rpg.toFixed(1)}
            subtitle="RPG"
            icon={<Shield className="w-4 h-4" />}
          />
          <StatCard
            title="Efficiency"
            value={analytics.efficiencyRating.toFixed(1)}
            subtitle="PER"
            icon={<Zap className="w-4 h-4" />}
          />
        </div>
      ) : null}

      {/* ── Performance trend + advanced metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Performance Trend
            </h2>
            <div className="flex gap-2 bg-background p-1 rounded border border-card-border">
              {(
                [
                  "points",
                  "assists",
                  "rebounds",
                  "efficiencyRating",
                ] as const
              ).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setChartMetric(metric)}
                  className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${
                    chartMetric === metric
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {metric === "efficiencyRating"
                    ? "EFF"
                    : metric.substring(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full">
            {loadingTrend ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
                LOADING CHART DATA...
              </div>
            ) : trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--card-border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => {
                      try {
                        return format(new Date(val), "MM/dd");
                      } catch {
                        return val;
                      }
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(val) => Math.round(val).toString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--card-border))",
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--primary))" }}
                    labelFormatter={(label) => {
                      try {
                        return format(new Date(label), "MMM dd, yyyy");
                      } catch {
                        return label;
                      }
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "hsl(var(--card))",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-card-border rounded">
                INSUFFICIENT DATA POINTS
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-primary" /> Advanced Metrics
          </h2>
          {analytics ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1 font-mono">
                  <span className="text-muted-foreground">Field Goal %</span>
                  <span className="font-bold">
                    {analytics.fieldGoalPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${analytics.fieldGoalPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-mono">
                  <span className="text-muted-foreground">3-Point %</span>
                  <span className="font-bold">
                    {analytics.threePointPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                  <div
                    className="h-full bg-primary opacity-80"
                    style={{ width: `${analytics.threePointPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-mono">
                  <span className="text-muted-foreground">Free Throw %</span>
                  <span className="font-bold">
                    {analytics.freeThrowPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                  <div
                    className="h-full bg-primary opacity-60"
                    style={{ width: `${analytics.freeThrowPct}%` }}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-card-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">
                      Turnovers / G
                    </div>
                    <div className="text-xl font-bold mt-1 font-mono">
                      {analytics.tpg.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">
                      Avg Plus/Minus
                    </div>
                    <div
                      className={`text-xl font-bold mt-1 font-mono ${
                        analytics.plusMinusAvg >= 0
                          ? "text-green-500"
                          : "text-destructive"
                      }`}
                    >
                      {analytics.plusMinusAvg >= 0 ? "+" : ""}
                      {analytics.plusMinusAvg.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">
                      Steals / G
                    </div>
                    <div className="text-xl font-bold mt-1 font-mono">
                      {analytics.spg.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">
                      Blocks / G
                    </div>
                    <div className="text-xl font-bold mt-1 font-mono">
                      {analytics.bpg.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm font-mono">
              NO ADVANCED METRICS
            </div>
          )}
        </div>
      </div>

      {/* ── Vertical Jump Tracker ── */}
      <div className="bg-card border border-card-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
              <ChevronUp className="w-5 h-5 text-primary" /> Vertical Jump Tracker
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Manual measurements over time — track vert progress session by session
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats */}
            {vertData.length > 0 && (
              <div className="flex gap-4 text-right">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-widest">
                    Personal Best
                  </div>
                  <div className="text-xl font-black font-mono text-primary">
                    {personalBest}"
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-widest">
                    Latest
                  </div>
                  <div className="text-xl font-black font-mono">
                    {latestVert}"
                  </div>
                </div>
                {improvement !== null && (
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">
                      Change
                    </div>
                    <div
                      className={`text-xl font-black font-mono ${
                        improvement >= 0 ? "text-green-500" : "text-destructive"
                      }`}
                    >
                      {improvement >= 0 ? "+" : ""}
                      {improvement}"
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowVertForm((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors border ${
                showVertForm
                  ? "border-card-border text-muted-foreground hover:text-foreground"
                  : "bg-primary text-primary-foreground border-primary hover:opacity-90"
              }`}
            >
              {showVertForm ? (
                <>
                  <X className="w-3.5 h-3.5" /> CANCEL
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> LOG JUMP
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input form */}
        {showVertForm && (
          <div className="mb-6 p-4 bg-background border border-card-border rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              NEW MEASUREMENT
            </h3>
            <VerticalJumpForm
              playerId={playerId}
              onClose={() => setShowVertForm(false)}
            />
          </div>
        )}

        {/* Chart */}
        {loadingVert ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            LOADING JUMP DATA...
          </div>
        ) : vertData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-card-border rounded gap-3">
            <ChevronUp className="w-8 h-8 opacity-30" />
            <div className="font-mono text-sm">NO JUMP MEASUREMENTS YET</div>
            <div className="text-xs opacity-60">
              Hit LOG JUMP to record the first session
            </div>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={vertData}
                margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
              >
                <defs>
                  <linearGradient id="vertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--card-border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    try {
                      return format(new Date(val), "MM/dd");
                    } catch {
                      return val;
                    }
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${v}"`}
                />
                <Tooltip content={<VertJumpTooltip />} />
                {personalBest !== null && (
                  <ReferenceLine
                    y={personalBest}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="6 3"
                    strokeOpacity={0.5}
                    label={{
                      value: "PB",
                      fill: "hsl(var(--primary))",
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="valueInches"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#vertGrad)"
                  dot={{
                    r: 5,
                    fill: "hsl(var(--card))",
                    stroke: "hsl(var(--primary))",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 7, fill: "hsl(var(--primary))" }}
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History table */}
        {vertData.length > 0 && (
          <div className="mt-4 border-t border-card-border pt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-mono">
              MEASUREMENT HISTORY
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {[...vertData].reverse().map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-card-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">
                    {(() => {
                      try {
                        return format(new Date(e.date), "MMM dd, yyyy");
                      } catch {
                        return e.date;
                      }
                    })()}
                  </span>
                  <div className="flex items-center gap-4">
                    {e.notes && (
                      <span className="text-muted-foreground italic truncate max-w-[180px]">
                        {e.notes}
                      </span>
                    )}
                    <span className="text-foreground font-bold">
                      {e.valueInches}"
                    </span>
                    <span className="text-muted-foreground">
                      {e.valueCm} cm
                    </span>
                    {e.valueInches === personalBest && (
                      <span className="text-primary text-[10px] uppercase tracking-wider">
                        PB
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Game Log ── */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight uppercase">Game Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-card-border">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Opponent</th>
                <th className="px-4 py-3 font-medium text-right">MIN</th>
                <th className="px-4 py-3 font-medium text-right">PTS</th>
                <th className="px-4 py-3 font-medium text-right">AST</th>
                <th className="px-4 py-3 font-medium text-right">REB</th>
                <th className="px-4 py-3 font-medium text-right">STL</th>
                <th className="px-4 py-3 font-medium text-right">BLK</th>
                <th className="px-4 py-3 font-medium text-right">TO</th>
                <th className="px-4 py-3 font-medium text-right">FG</th>
                <th className="px-4 py-3 font-medium text-right">+/-</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {loadingStats ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    Loading log...
                  </td>
                </tr>
              ) : stats && stats.length > 0 ? (
                stats.map((stat) => (
                  <tr
                    key={stat.id}
                    className="border-b border-card-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {stat.game
                        ? format(new Date(stat.game.date), "MM/dd/yy")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium">
                      {stat.game
                        ? `${stat.game.homeAway === "HOME" ? "vs" : "@"} ${stat.game.opponent}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stat.minutesPlayed}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {stat.points}
                    </td>
                    <td className="px-4 py-3 text-right">{stat.assists}</td>
                    <td className="px-4 py-3 text-right">{stat.rebounds}</td>
                    <td className="px-4 py-3 text-right">{stat.steals}</td>
                    <td className="px-4 py-3 text-right">{stat.blocks}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {stat.turnovers}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {stat.fieldGoalsMade}/{stat.fieldGoalsAttempted}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        stat.plusMinus >= 0
                          ? "text-green-500"
                          : "text-destructive"
                      }`}
                    >
                      {stat.plusMinus >= 0 ? "+" : ""}
                      {stat.plusMinus}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-6 text-center text-muted-foreground border-dashed"
                  >
                    No games logged
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
