import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { useListPlayers } from "@workspace/api-client-react";
import {
  ArrowLeft, Play, Pause, Plus, Minus, RotateCcw,
  ChevronRight, Clock, Wifi, WifiOff, Check, X,
  Timer, AlertCircle, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "setup" | "live" | "ended";
type Quarter = 1 | 2 | 3 | 4 | 5; // 5 = OT

interface PlayerStats {
  pts: number;
  ast: number;
  reb: number;
  stl: number;
  blk: number;
  to: number;
  pf: number;
}

interface PlayerInGame {
  id: number;
  name: string;
  number: string;
  position: string;
  stats: PlayerStats;
  secondsPlayed: number;
  onCourt: boolean;
}

type EventType =
  | { id: string; ts: number; kind: "stat"; playerId: number; playerName: string; field: keyof PlayerStats; delta: number; ptsAdded: number }
  | { id: string; ts: number; kind: "sub"; inId: number; outId: number; inName: string; outName: string }
  | { id: string; ts: number; kind: "opp_score"; delta: number }
  | { id: string; ts: number; kind: "our_score"; delta: number }
  | { id: string; ts: number; kind: "timeout"; team: "us" | "opp" }
  | { id: string; ts: number; kind: "quarter_advance"; from: Quarter; to: Quarter };

const QUARTER_SECONDS = 12 * 60; // 12 min quarters

function emptyStats(): PlayerStats {
  return { pts: 0, ast: 0, reb: 0, stl: 0, blk: 0, to: 0, pf: 0 };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(s: number): string {
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.abs(s) % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

interface SetupProps {
  onStart: (opponent: string, startingFive: number[], allPlayers: PlayerInGame[]) => void;
}

function GameModeSetup({ onStart }: SetupProps) {
  const { data: players = [], isLoading } = useListPlayers();
  const [opponent, setOpponent] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const togglePlayer = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 5) {
          setError("Maximum 5 starters — deselect a player first");
          return prev;
        }
        next.delete;
        next.add(id);
      }
      setError("");
      return next;
    });
  };

  const handleStart = () => {
    if (!opponent.trim()) { setError("Enter an opponent name"); return; }
    if (selected.size !== 5) { setError("Select exactly 5 starters"); return; }

    const allInGame: PlayerInGame[] = players.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number ?? "",
      position: p.position ?? "",
      stats: emptyStats(),
      secondsPlayed: 0,
      onCourt: selected.has(p.id),
    }));

    onStart(opponent.trim(), Array.from(selected), allInGame);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary">Game Mode</span>
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase">New Game Session</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-8">
        {/* Opponent */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-mono">
            Opponent Team
          </label>
          <input
            type="text"
            value={opponent}
            onChange={(e) => { setOpponent(e.target.value); setError(""); }}
            placeholder="e.g. Downtown Blazers"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
        </div>

        {/* Player selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
              Starting Five
            </label>
            <span className={`text-sm font-mono font-bold ${selected.size === 5 ? "text-green-400" : "text-white/40"}`}>
              {selected.size}/5
            </span>
          </div>

          {isLoading ? (
            <div className="text-white/40 font-mono text-sm animate-pulse py-4">LOADING ROSTER...</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {players.map((p) => {
                const isSelected = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "bg-primary/10 border-primary text-white"
                        : "bg-white/3 border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-primary bg-primary" : "border-white/30"
                    }`}>
                      {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>
                    <span className="text-xl font-black text-white/30 w-8 shrink-0">
                      #{p.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base leading-tight">{p.name}</div>
                      <div className="text-xs font-mono text-white/40">{p.position} · {p.team}</div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-mono tracking-wider text-primary shrink-0">
                        STARTING
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!opponent.trim() || selected.size !== 5}
          className="w-full bg-primary text-black font-black text-lg uppercase tracking-widest py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <Zap className="w-5 h-5" /> START GAME
        </button>
      </div>
    </div>
  );
}

// ─── Stat Button ──────────────────────────────────────────────────────────────

interface StatButtonProps {
  label: string;
  color: "blue" | "green" | "teal" | "red" | "orange";
  onClick: () => void;
  count?: number;
}

const colorMap = {
  blue: "bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/30 active:bg-blue-500/50",
  green: "bg-green-500/15 border-green-500/30 text-green-300 hover:bg-green-500/30 active:bg-green-500/50",
  teal: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 active:bg-cyan-500/50",
  red: "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/30 active:bg-red-500/50",
  orange: "bg-orange-500/15 border-orange-500/30 text-orange-300 hover:bg-orange-500/30 active:bg-orange-500/50",
};

function StatButton({ label, color, onClick, count }: StatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative min-w-[52px] h-11 px-2 rounded border font-bold text-sm font-mono uppercase tracking-wide transition-colors select-none ${colorMap[color]}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

// ─── Player Row ───────────────────────────────────────────────────────────────

interface PlayerRowProps {
  player: PlayerInGame;
  onStat: (playerId: number, field: keyof PlayerStats, ptsAdded: number) => void;
  onSubOut: (playerId: number) => void;
  canSubOut: boolean;
  globalClockRunning: boolean;
}

function PlayerRow({ player, onStat, onSubOut, canSubOut, globalClockRunning }: PlayerRowProps) {
  const { stats, secondsPlayed, name, number, position } = player;

  const handleStat = (field: keyof PlayerStats, ptsAdded = 0) =>
    onStat(player.id, field, ptsAdded);

  return (
    <div className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 min-h-[72px]">
      {/* Identity */}
      <div className="shrink-0 w-[120px]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-mono text-white/30 uppercase">{position}</span>
          <span className="text-xs font-black text-primary/60">#{number}</span>
        </div>
        <div className="font-black text-sm leading-tight text-white truncate">{name}</div>
        {/* Playtime */}
        <div className="flex items-center gap-1 mt-1">
          <Timer className="w-3 h-3 text-white/30" />
          <span className="text-xs font-mono text-white/50">{formatTime(secondsPlayed)}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-white/10 shrink-0" />

      {/* Stat buttons */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-none py-0.5">
        <StatButton label="+2" color="blue" count={0} onClick={() => { handleStat("pts", 2); }} />
        <StatButton label="+3" color="blue" count={0} onClick={() => { handleStat("pts", 3); }} />
        <StatButton label="+1" color="blue" count={0} onClick={() => { handleStat("pts", 1); }} />
        <StatButton label="AST" color="green" count={stats.ast} onClick={() => handleStat("ast")} />
        <StatButton label="REB" color="green" count={stats.reb} onClick={() => handleStat("reb")} />
        <StatButton label="STL" color="teal" count={stats.stl} onClick={() => handleStat("stl")} />
        <StatButton label="BLK" color="teal" count={stats.blk} onClick={() => handleStat("blk")} />
        <StatButton label="TO" color="red" count={stats.to} onClick={() => handleStat("to")} />
        <StatButton label="PF" color="orange" count={stats.pf} onClick={() => handleStat("pf")} />
      </div>

      {/* Per-player totals */}
      <div className="shrink-0 w-[90px] grid grid-cols-3 gap-x-1 gap-y-0.5 text-center">
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase">PTS</div>
          <div className="text-base font-black text-white">{stats.pts}</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase">AST</div>
          <div className="text-base font-black text-white/80">{stats.ast}</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase">REB</div>
          <div className="text-base font-black text-white/80">{stats.reb}</div>
        </div>
      </div>

      {/* Sub out */}
      <button
        onClick={() => onSubOut(player.id)}
        disabled={!canSubOut}
        title="Sub out"
        className="shrink-0 w-9 h-9 rounded-lg border border-white/10 text-white/30 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Bench Panel ──────────────────────────────────────────────────────────────

interface BenchProps {
  players: PlayerInGame[];
  courtCount: number;
  onSubIn: (playerId: number) => void;
}

function BenchPanel({ players, courtCount, onSubIn }: BenchProps) {
  const courtFull = courtCount >= 5;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-white/8">
        <div className="text-[10px] uppercase tracking-widest font-mono text-white/40">
          Bench <span className="text-white/20">({players.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {players.length === 0 ? (
          <div className="text-center py-6 text-white/20 text-xs font-mono">
            ALL PLAYERS ON COURT
          </div>
        ) : (
          players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-lg p-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-primary/50">#{p.number}</span>
                  <span className="text-[10px] font-mono text-white/30 uppercase">{p.position}</span>
                </div>
                <div className="font-bold text-sm text-white leading-tight truncate">{p.name}</div>
                <div className="text-[10px] font-mono text-white/30 mt-0.5">
                  {formatTime(p.secondsPlayed)} played
                </div>
              </div>

              {p.stats.pts > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-[9px] text-white/30 font-mono">PTS</div>
                  <div className="text-sm font-black text-white/60">{p.stats.pts}</div>
                </div>
              )}

              <button
                onClick={() => onSubIn(p.id)}
                disabled={courtFull}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                SUB IN
              </button>
            </div>
          ))
        )}
      </div>

      {courtFull && players.length > 0 && (
        <div className="px-3 py-2 border-t border-white/8 text-[10px] font-mono text-white/30 text-center">
          Sub out a player first
        </div>
      )}
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

interface TopBarProps {
  quarter: Quarter;
  clockSeconds: number;
  clockRunning: boolean;
  ourScore: number;
  oppScore: number;
  opponent: string;
  timeoutsUs: number;
  timeoutsOpp: number;
  onToggleClock: () => void;
  onAdvanceQuarter: () => void;
  onEndGame: () => void;
  onOppScoreDelta: (d: number) => void;
}

const quarterLabel = (q: Quarter) => (q === 5 ? "OT" : `Q${q}`);

function TopBar({
  quarter, clockSeconds, clockRunning, ourScore, oppScore, opponent,
  timeoutsUs, onToggleClock, onAdvanceQuarter, onEndGame, onOppScoreDelta,
}: TopBarProps) {
  return (
    <div className="flex items-center gap-0 bg-[#111] border-b border-white/10 px-4 h-[64px] shrink-0">
      {/* Quarter + Clock */}
      <div className="flex items-center gap-3 mr-4">
        <button
          onClick={onAdvanceQuarter}
          className="text-xs font-mono font-bold px-2 py-1 rounded border border-white/10 text-primary hover:bg-primary/10 transition-colors"
          title="Advance quarter"
        >
          {quarterLabel(quarter)}
        </button>

        <div
          className={`text-2xl font-black font-mono tabular-nums tracking-tighter ${
            clockSeconds <= 60 ? "text-red-400" : "text-white"
          }`}
        >
          {formatTime(clockSeconds)}
        </div>

        <button
          onClick={onToggleClock}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
            clockRunning
              ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
              : "border-green-500/40 text-green-400 hover:bg-green-500/10"
          }`}
        >
          {clockRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-2 shrink-0" />

      {/* Scores */}
      <div className="flex items-center gap-3 flex-1 justify-center">
        {/* Our score */}
        <div className="text-center">
          <div className="text-[9px] font-mono uppercase text-white/30 tracking-wider">US</div>
          <div className="text-3xl font-black tabular-nums text-white leading-none">{ourScore}</div>
        </div>

        <div className="text-white/30 text-xl font-thin">—</div>

        {/* Opponent score */}
        <div className="text-center">
          <div className="text-[9px] font-mono uppercase text-white/30 tracking-wider truncate max-w-[80px]">
            {opponent}
          </div>
          <div className="text-3xl font-black tabular-nums text-white/70 leading-none">{oppScore}</div>
        </div>

        {/* Opp score controls */}
        <div className="flex flex-col gap-1 ml-1">
          <button
            onClick={() => onOppScoreDelta(1)}
            className="w-6 h-6 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/30 flex items-center justify-center transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => onOppScoreDelta(-1)}
            className="w-6 h-6 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/30 flex items-center justify-center transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-2 shrink-0" />

      {/* Timeouts + End */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] font-mono text-white/30">
          TO: {timeoutsUs}
        </div>

        <button
          onClick={onEndGame}
          className="px-3 py-1.5 rounded border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"
        >
          END GAME
        </button>
      </div>
    </div>
  );
}

// ─── Event Bar ────────────────────────────────────────────────────────────────

interface EventBarProps {
  events: EventType[];
  onUndo: () => void;
  timeoutsUs: number;
  onTimeout: () => void;
}

function EventBar({ events, onUndo, timeoutsUs, onTimeout }: EventBarProps) {
  const lastEvent = events[events.length - 1];

  const describeEvent = (e: EventType): string => {
    if (!e) return "";
    switch (e.kind) {
      case "stat":
        return `${e.playerName}: +${e.field.toUpperCase()}${e.ptsAdded > 0 ? ` (+${e.ptsAdded}pts)` : ""}`;
      case "sub":
        return `SUB: ${e.inName} IN / ${e.outName} OUT`;
      case "opp_score":
        return `OPP SCORE ${e.delta > 0 ? "+" : ""}${e.delta}`;
      case "our_score":
        return `SCORE CORRECTION ${e.delta > 0 ? "+" : ""}${e.delta}`;
      case "timeout":
        return `TIMEOUT — ${e.team === "us" ? "US" : "OPP"}`;
      case "quarter_advance":
        return `${quarterLabel(e.from)} → ${quarterLabel(e.to)}`;
    }
  };

  return (
    <div className="flex items-center gap-3 bg-[#0D0D0D] border-t border-white/10 px-4 h-[52px] shrink-0">
      {/* Last action */}
      <div className="flex-1 min-w-0">
        {lastEvent ? (
          <div className="flex items-center gap-2 text-white/40 text-xs font-mono truncate">
            <Clock className="w-3 h-3 shrink-0" />
            {describeEvent(lastEvent)}
          </div>
        ) : (
          <div className="text-white/20 text-xs font-mono">No actions yet</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTimeout}
          disabled={timeoutsUs <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-yellow-500/20 text-yellow-400/60 text-xs font-bold uppercase tracking-wide hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/40 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <WifiOff className="w-3.5 h-3.5" /> TIMEOUT ({timeoutsUs})
        </button>

        <button
          onClick={onUndo}
          disabled={events.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wide hover:bg-white/5 hover:text-white hover:border-white/30 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" /> UNDO
        </button>
      </div>
    </div>
  );
}

// ─── End Game Summary ─────────────────────────────────────────────────────────

interface EndGameProps {
  players: PlayerInGame[];
  ourScore: number;
  oppScore: number;
  opponent: string;
  onRestart: () => void;
}

function EndGameSummary({ players, ourScore, oppScore, opponent, onRestart }: EndGameProps) {
  const sorted = [...players].sort((a, b) => b.stats.pts - a.stats.pts);
  const won = ourScore > oppScore;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Game Summary</div>
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-black ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "WIN" : "LOSS"}
          </div>
          <div className="text-3xl font-black">
            {ourScore} <span className="text-white/30 text-xl">—</span> {oppScore}
          </div>
          <div className="text-white/40 font-mono">vs {opponent}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-[10px] uppercase tracking-widest font-mono text-white/30 mb-3">Box Score</div>
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40">Player</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">MIN</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">PTS</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">AST</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">REB</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">STL</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">BLK</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">TO</th>
                  <th className="px-4 py-2 text-[10px] font-mono uppercase text-white/40 text-right">PF</th>
                </tr>
              </thead>
              <tbody className="font-mono divide-y divide-white/5">
                {sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[10px] text-white/30">{p.position} · #{p.number}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-white/60">{formatTime(p.secondsPlayed)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-white">{p.stats.pts}</td>
                    <td className="px-4 py-2.5 text-right text-white/70">{p.stats.ast}</td>
                    <td className="px-4 py-2.5 text-right text-white/70">{p.stats.reb}</td>
                    <td className="px-4 py-2.5 text-right text-white/60">{p.stats.stl}</td>
                    <td className="px-4 py-2.5 text-right text-white/60">{p.stats.blk}</td>
                    <td className="px-4 py-2.5 text-right text-red-400/70">{p.stats.to}</td>
                    <td className="px-4 py-2.5 text-right text-orange-400/70">{p.stats.pf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-black font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              <Zap className="w-4 h-4" /> New Game
            </button>
            <Link href="/">
              <a className="flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-white font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Game Mode Page ───────────────────────────────────────────────────────

export default function GameMode() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [opponent, setOpponent] = useState("");
  const [players, setPlayers] = useState<PlayerInGame[]>([]);
  const [quarter, setQuarter] = useState<Quarter>(1);
  const [clockSeconds, setClockSeconds] = useState(QUARTER_SECONDS);
  const [clockRunning, setClockRunning] = useState(false);
  const [oppScore, setOppScore] = useState(0);
  const [timeoutsUs, setTimeoutsUs] = useState(5);
  const [events, setEvents] = useState<EventType[]>([]);

  const onCourt = players.filter((p) => p.onCourt);
  const bench = players.filter((p) => !p.onCourt);
  const ourScore = players.reduce((s, p) => s + p.stats.pts, 0);

  // ── Clock tick ──
  useEffect(() => {
    if (!clockRunning || phase !== "live") return;
    const interval = setInterval(() => {
      setClockSeconds((c) => Math.max(0, c - 1));
      setPlayers((prev) =>
        prev.map((p) =>
          p.onCourt ? { ...p, secondsPlayed: p.secondsPlayed + 1 } : p
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [clockRunning, phase]);

  // ── Auto-pause when clock hits 0 ──
  useEffect(() => {
    if (clockSeconds === 0) setClockRunning(false);
  }, [clockSeconds]);

  // ── Actions ──

  const handleStart = useCallback(
    (opp: string, _startingFive: number[], allPlayers: PlayerInGame[]) => {
      setOpponent(opp);
      setPlayers(allPlayers);
      setPhase("live");
    },
    []
  );

  const handleStat = useCallback(
    (playerId: number, field: keyof PlayerStats, ptsAdded: number) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                stats: {
                  ...p.stats,
                  [field]: p.stats[field] + 1,
                  ...(ptsAdded > 0 ? { pts: p.stats.pts + ptsAdded } : {}),
                },
              }
            : p
        )
      );

      const event: EventType = {
        id: uid(),
        ts: Date.now(),
        kind: "stat",
        playerId,
        playerName: player.name,
        field,
        delta: 1,
        ptsAdded,
      };
      setEvents((prev) => [...prev, event]);
    },
    [players]
  );

  const handleSubOut = useCallback(
    (playerId: number) => {
      if (onCourt.length <= 1) return;
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, onCourt: false } : p))
      );
    },
    [players, onCourt.length]
  );

  const handleSubIn = useCallback(
    (playerId: number) => {
      if (onCourt.length >= 5) return;
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, onCourt: true } : p))
      );
    },
    [players, onCourt.length]
  );

  const handleUndo = useCallback(() => {
    if (events.length === 0) return;
    const lastEvent = events[events.length - 1];

    if (lastEvent.kind === "stat") {
      const { playerId, field, delta, ptsAdded } = lastEvent;
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                stats: {
                  ...p.stats,
                  [field]: Math.max(0, p.stats[field] - delta),
                  ...(ptsAdded > 0 ? { pts: Math.max(0, p.stats.pts - ptsAdded) } : {}),
                },
              }
            : p
        )
      );
    } else if (lastEvent.kind === "opp_score") {
      setOppScore((s) => Math.max(0, s - lastEvent.delta));
    } else if (lastEvent.kind === "timeout") {
      if (lastEvent.team === "us") setTimeoutsUs((t) => t + 1);
    } else if (lastEvent.kind === "sub") {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === lastEvent.inId) return { ...p, onCourt: false };
          if (p.id === lastEvent.outId) return { ...p, onCourt: true };
          return p;
        })
      );
    }

    setEvents((prev) => prev.slice(0, -1));
  }, [events]);

  const handleOppScoreDelta = useCallback(
    (d: number) => {
      setOppScore((s) => Math.max(0, s + d));
      const event: EventType = { id: uid(), ts: Date.now(), kind: "opp_score", delta: d };
      setEvents((prev) => [...prev, event]);
    },
    []
  );

  const handleAdvanceQuarter = useCallback(() => {
    if (quarter >= 5) return;
    const nextQ = (quarter + 1) as Quarter;
    const event: EventType = {
      id: uid(), ts: Date.now(), kind: "quarter_advance", from: quarter, to: nextQ,
    };
    setEvents((prev) => [...prev, event]);
    setQuarter(nextQ);
    setClockSeconds(QUARTER_SECONDS);
    setClockRunning(false);
  }, [quarter]);

  const handleTimeout = useCallback(() => {
    if (timeoutsUs <= 0) return;
    setTimeoutsUs((t) => t - 1);
    setClockRunning(false);
    const event: EventType = { id: uid(), ts: Date.now(), kind: "timeout", team: "us" };
    setEvents((prev) => [...prev, event]);
  }, [timeoutsUs]);

  const handleEndGame = useCallback(() => {
    setClockRunning(false);
    setPhase("ended");
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("setup");
    setOpponent("");
    setPlayers([]);
    setQuarter(1);
    setClockSeconds(QUARTER_SECONDS);
    setClockRunning(false);
    setOppScore(0);
    setTimeoutsUs(5);
    setEvents([]);
  }, []);

  // ── Render phases ──

  if (phase === "setup") {
    return <GameModeSetup onStart={handleStart} />;
  }

  if (phase === "ended") {
    return (
      <EndGameSummary
        players={players}
        ourScore={ourScore}
        oppScore={oppScore}
        opponent={opponent}
        onRestart={handleRestart}
      />
    );
  }

  // ── Live game ──

  return (
    <div
      className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden"
      style={{ fontFamily: "inherit" }}
    >
      {/* Top bar */}
      <TopBar
        quarter={quarter}
        clockSeconds={clockSeconds}
        clockRunning={clockRunning}
        ourScore={ourScore}
        oppScore={oppScore}
        opponent={opponent}
        timeoutsUs={timeoutsUs}
        timeoutsOpp={0}
        onToggleClock={() => setClockRunning((r) => !r)}
        onAdvanceQuarter={handleAdvanceQuarter}
        onEndGame={handleEndGame}
        onOppScoreDelta={handleOppScoreDelta}
      />

      {/* Main section */}
      <div className="flex flex-1 overflow-hidden">
        {/* ON COURT panel */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-white/8">
          {/* Court header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">
                On Court
              </span>
              <span className={`text-xs font-mono font-bold ${onCourt.length === 5 ? "text-green-400" : "text-yellow-400"}`}>
                ({onCourt.length}/5)
              </span>
            </div>
            <div className="text-[10px] font-mono text-white/20 hidden sm:block">
              BUTTONS: PTS+2 / +3 / +1FT · AST · REB · STL · BLK · TO · PF
            </div>
          </div>

          {/* Player rows */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {onCourt.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/20 font-mono text-sm">
                NO PLAYERS ON COURT — SUB IN FROM BENCH
              </div>
            ) : (
              onCourt.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  onStat={handleStat}
                  onSubOut={handleSubOut}
                  canSubOut={onCourt.length > 1}
                  globalClockRunning={clockRunning}
                />
              ))
            )}
          </div>

          {/* Score bar below players */}
          <div className="border-t border-white/8 px-4 py-2 flex items-center gap-6 shrink-0 bg-white/2">
            <div className="text-[10px] uppercase font-mono text-white/30 tracking-widest">Team Totals</div>
            {(["pts", "ast", "reb", "stl", "blk", "to"] as (keyof PlayerStats)[]).map((field) => {
              const total = players.reduce((s, p) => s + p.stats[field], 0);
              return (
                <div key={field} className="text-center">
                  <div className="text-[9px] font-mono text-white/30 uppercase">{field}</div>
                  <div className="text-sm font-black text-white">{total}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BENCH panel */}
        <div className="w-[240px] shrink-0 flex flex-col overflow-hidden">
          <BenchPanel
            players={bench}
            courtCount={onCourt.length}
            onSubIn={handleSubIn}
          />
        </div>
      </div>

      {/* Event bar */}
      <EventBar
        events={events}
        onUndo={handleUndo}
        timeoutsUs={timeoutsUs}
        onTimeout={handleTimeout}
      />
    </div>
  );
}
