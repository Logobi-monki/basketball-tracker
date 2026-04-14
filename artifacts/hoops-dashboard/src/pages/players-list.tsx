import { useListPlayers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function PlayersList() {
  const { data: players, isLoading } = useListPlayers();
  const [search, setSearch] = useState("");

  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ACTIVE ROSTER</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wider">Player Profiles & Analytics</p>
        </div>
        <Link href="/players/new" className="inline-block">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-wider font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add Player
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="SEARCH ROSTER..." 
            className="pl-9 bg-card border-card-border uppercase font-mono text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 bg-card rounded-lg border border-card-border animate-pulse" />
          ))
        ) : filteredPlayers?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-card-border rounded-lg">
            NO PLAYERS FOUND MATCHING QUERY
          </div>
        ) : (
          filteredPlayers?.map(player => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <div className="group bg-card border border-card-border hover:border-primary/50 transition-all rounded-lg p-5 cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute -right-4 -top-4 text-8xl font-black text-muted/10 opacity-50 select-none group-hover:text-primary/10 transition-colors">
                  {player.number}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded uppercase tracking-wider">
                      {player.position}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">#{player.number}</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground truncate">{player.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{player.team}</p>
                </div>
                <div className="relative z-10 mt-6 flex justify-between items-end">
                  <div className="text-xs text-muted-foreground font-mono uppercase">
                    Season: {player.season}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
