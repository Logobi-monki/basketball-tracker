import { useParams, Link } from "wouter";
import { useGetPlayer, useGetPlayerStats, useGetPlayerAnalytics, useGetPlayerTrend } from "@workspace/api-client-react";
import { StatCard } from "@/components/stat-card";
import { ArrowLeft, Target, Activity, Shield, TrendingUp, Zap, Clock, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useState } from "react";
import { format } from "date-fns";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const playerId = parseInt(id, 10);
  
  const { data: player, isLoading: loadingPlayer } = useGetPlayer(playerId, { query: { enabled: !!playerId } });
  const { data: analytics, isLoading: loadingAnalytics } = useGetPlayerAnalytics(playerId, { query: { enabled: !!playerId } });
  const { data: trend, isLoading: loadingTrend } = useGetPlayerTrend(playerId, { query: { enabled: !!playerId } });
  const { data: stats, isLoading: loadingStats } = useGetPlayerStats(playerId, { query: { enabled: !!playerId } });

  const [chartMetric, setChartMetric] = useState<"points" | "assists" | "rebounds" | "efficiencyRating">("points");

  if (loadingPlayer) return <div className="p-8 text-center animate-pulse">LOADING PLAYER DATA...</div>;
  if (!player) return <div className="p-8 text-center text-destructive">PLAYER NOT FOUND</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono uppercase tracking-wider mb-6">
        <Link href="/players" className="hover:text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> BACK TO ROSTER
        </Link>
        <span>/</span>
        <span className="text-foreground">PLAYER_{player.id}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-card-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary text-primary-foreground text-xs font-black px-2 py-1 rounded uppercase tracking-widest">
              {player.position}
            </span>
            <span className="text-3xl font-black text-muted-foreground/30">#{player.number}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{player.name}</h1>
          <p className="text-muted-foreground mt-1 font-mono tracking-wider">{player.team} | {player.season}</p>
        </div>
        
        {analytics && (
          <div className="flex gap-4">
            <div className="bg-card border border-card-border rounded px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Consistency</div>
              <div className="text-2xl font-bold font-mono text-primary">{analytics.consistencyScore.toFixed(0)}</div>
            </div>
            <div className="bg-card border border-card-border rounded px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Fatigue Idx</div>
              <div className={`text-2xl font-bold font-mono ${analytics.fatigueIndex > 80 ? 'text-destructive' : 'text-green-500'}`}>
                {analytics.fatigueIndex.toFixed(0)}
              </div>
            </div>
          </div>
        )}
      </div>

      {loadingAnalytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-card rounded-lg border border-card-border" />)}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Points / G" value={analytics.ppg.toFixed(1)} subtitle="PPG" icon={<Target className="w-4 h-4" />} />
          <StatCard title="Assists / G" value={analytics.apg.toFixed(1)} subtitle="APG" icon={<Activity className="w-4 h-4" />} />
          <StatCard title="Rebounds / G" value={analytics.rpg.toFixed(1)} subtitle="RPG" icon={<Shield className="w-4 h-4" />} />
          <StatCard title="Efficiency" value={analytics.efficiencyRating.toFixed(1)} subtitle="PER" icon={<Zap className="w-4 h-4" />} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Performance Trend
            </h2>
            <div className="flex gap-2 bg-background p-1 rounded border border-card-border">
              {(['points', 'assists', 'rebounds', 'efficiencyRating'] as const).map(metric => (
                <button
                  key={metric}
                  onClick={() => setChartMetric(metric)}
                  className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${chartMetric === metric ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {metric === 'efficiencyRating' ? 'EFF' : metric.substring(0,3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {loadingTrend ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">LOADING CHART DATA...</div>
            ) : trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--card-border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      try { return format(new Date(val), 'MM/dd'); } catch { return val; }
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
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--card-border))', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                    labelFormatter={(label) => {
                       try { return format(new Date(label), 'MMM dd, yyyy'); } catch { return label; }
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={chartMetric} 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-card-border rounded">INSUFFICIENT DATA POINTS</div>
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
                  <span className="font-bold">{analytics.fieldGoalPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${analytics.fieldGoalPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-mono">
                  <span className="text-muted-foreground">3-Point %</span>
                  <span className="font-bold">{analytics.threePointPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                  <div className="h-full bg-primary opacity-80" style={{ width: `${analytics.threePointPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-mono">
                  <span className="text-muted-foreground">Free Throw %</span>
                  <span className="font-bold">{analytics.freeThrowPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                  <div className="h-full bg-primary opacity-60" style={{ width: `${analytics.freeThrowPct}%` }} />
                </div>
              </div>
              
              <div className="pt-6 border-t border-card-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Turnovers / G</div>
                    <div className="text-xl font-bold mt-1 font-mono">{analytics.tpg.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Avg Plus/Minus</div>
                    <div className={`text-xl font-bold mt-1 font-mono ${analytics.plusMinusAvg >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {analytics.plusMinusAvg >= 0 ? '+' : ''}{analytics.plusMinusAvg.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Steals / G</div>
                    <div className="text-xl font-bold mt-1 font-mono">{analytics.spg.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Blocks / G</div>
                    <div className="text-xl font-bold mt-1 font-mono">{analytics.bpg.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm font-mono">NO ADVANCED METRICS</div>
          )}
        </div>
      </div>

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
                <tr><td colSpan={11} className="px-4 py-6 text-center text-muted-foreground">Loading log...</td></tr>
              ) : stats && stats.length > 0 ? (
                stats.map(stat => (
                  <tr key={stat.id} className="border-b border-card-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">
                      {stat.game ? format(new Date(stat.game.date), 'MM/dd/yy') : '-'}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium">
                      {stat.game ? `${stat.game.homeAway === 'HOME' ? 'vs' : '@'} ${stat.game.opponent}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">{stat.minutesPlayed}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{stat.points}</td>
                    <td className="px-4 py-3 text-right">{stat.assists}</td>
                    <td className="px-4 py-3 text-right">{stat.rebounds}</td>
                    <td className="px-4 py-3 text-right">{stat.steals}</td>
                    <td className="px-4 py-3 text-right">{stat.blocks}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{stat.turnovers}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      {stat.fieldGoalsMade}/{stat.fieldGoalsAttempted}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${stat.plusMinus >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {stat.plusMinus >= 0 ? '+' : ''}{stat.plusMinus}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={11} className="px-4 py-6 text-center text-muted-foreground border-dashed">No games logged</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
