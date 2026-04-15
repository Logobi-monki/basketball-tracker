import { useListPlayers, useDeletePlayer, getListPlayersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Search, ChevronRight, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ConfirmDeleteProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmDelete({ name, onConfirm, onCancel, isPending }: ConfirmDeleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-card-border rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Remove Player</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently remove <span className="font-semibold text-foreground">{name}</span> and all their game stats? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="destructive"
            className="flex-1 font-bold uppercase tracking-wider"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Removing..." : "Remove Player"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-bold uppercase tracking-wider"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PlayersList() {
  const queryClient = useQueryClient();
  const { data: players, isLoading } = useListPlayers();
  const deletePlayer = useDeletePlayer();
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const filteredPlayers = players?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  const confirmPlayer = players?.find(p => p.id === confirmId);

  const handleDelete = () => {
    if (confirmId == null) return;
    deletePlayer.mutate(
      { id: confirmId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
          setConfirmId(null);
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {confirmPlayer && (
        <ConfirmDelete
          name={confirmPlayer.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          isPending={deletePlayer.isPending}
        />
      )}

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
            <div key={player.id} className="group relative bg-card border border-card-border hover:border-primary/50 transition-all rounded-lg overflow-hidden h-full flex flex-col">
              {/* Delete button */}
              <button
                onClick={(e) => { e.preventDefault(); setConfirmId(player.id); }}
                className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive/60 hover:text-destructive"
                title="Remove player"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <Link href={`/players/${player.id}`} className="flex-1 p-5 flex flex-col justify-between cursor-pointer relative">
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
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
