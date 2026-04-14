import { useGetTeamSummary, useGetLeaderboard } from "@workspace/api-client-react";
import { StatCard } from "@/components/stat-card";
import { Users, Activity, Target, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetTeamSummary();
  const { data: leaderboard, isLoading: loadingLeaderboard } = useGetLeaderboard();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">TEAM OVERVIEW</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-wider">Performance metrics & Leaderboard</p>
      </div>

      {loadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card rounded-lg border border-card-border" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Avg Points" 
            value={summary.avgPpg.toFixed(1)} 
            subtitle="PPG" 
            icon={<Target className="w-4 h-4" />} 
          />
          <StatCard 
            title="Avg Assists" 
            value={summary.avgApg.toFixed(1)} 
            subtitle="APG" 
            icon={<Activity className="w-4 h-4" />} 
          />
          <StatCard 
            title="Avg Rebounds" 
            value={summary.avgRpg.toFixed(1)} 
            subtitle="RPG" 
            icon={<Shield className="w-4 h-4" />} 
          />
          <StatCard 
            title="Total Roster" 
            value={summary.totalPlayers} 
            subtitle="PLAYERS" 
            icon={<Users className="w-4 h-4" />} 
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">EFFICIENCY LEADERBOARD</h2>
            <Link href="/players" className="text-sm text-primary hover:underline flex items-center gap-1 uppercase tracking-wider font-medium">
              Full Roster <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-card-border uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium text-right">PPG</th>
                  <th className="px-4 py-3 font-medium text-right">APG</th>
                  <th className="px-4 py-3 font-medium text-right">RPG</th>
                  <th className="px-4 py-3 font-medium text-right text-primary">EFF</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaderboard ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground animate-pulse">Loading data stream...</td>
                  </tr>
                ) : leaderboard && leaderboard.length > 0 ? (
                  leaderboard.map((entry, idx) => (
                    <tr key={entry.playerId} className="border-b border-card-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link href={`/players/${entry.playerId}`} className="hover:text-primary transition-colors">
                          {entry.playerName}
                        </Link>
                        <span className="ml-2 text-xs text-muted-foreground">{entry.position}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{entry.ppg.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-mono">{entry.apg.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-mono">{entry.rpg.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary font-bold">{entry.efficiencyRating.toFixed(1)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight uppercase">Top Performers</h2>
          {summary && (
            <div className="flex flex-col gap-4">
              <div className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Scoring Leader</div>
                  <div className="font-bold text-lg">{summary.topScorer || "N/A"}</div>
                </div>
                <Target className="w-8 h-8 text-muted/30" />
              </div>
              <div className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Assist Leader</div>
                  <div className="font-bold text-lg">{summary.topAssister || "N/A"}</div>
                </div>
                <Activity className="w-8 h-8 text-muted/30" />
              </div>
              <div className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-medium mb-1">Rebound Leader</div>
                  <div className="font-bold text-lg">{summary.topRebounder || "N/A"}</div>
                </div>
                <Shield className="w-8 h-8 text-muted/30" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
