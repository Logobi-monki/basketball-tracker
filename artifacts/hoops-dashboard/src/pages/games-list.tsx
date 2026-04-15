import { useListGames, useDeleteGame, getListGamesQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Hash, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteProps {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmDelete({ label, onConfirm, onCancel, isPending }: ConfirmDeleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-card-border rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Remove Game</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently remove the game vs{" "}
              <span className="font-semibold text-foreground">{label}</span> and all associated player stats? This cannot be undone.
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
            {isPending ? "Removing..." : "Remove Game"}
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

export default function GamesList() {
  const queryClient = useQueryClient();
  const { data: games, isLoading } = useListGames();
  const deleteGame = useDeleteGame();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const confirmGame = games?.find(g => g.id === confirmId);

  const handleDelete = () => {
    if (confirmId == null) return;
    deleteGame.mutate(
      { id: confirmId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() });
          setConfirmId(null);
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {confirmGame && (
        <ConfirmDelete
          label={confirmGame.opponent}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          isPending={deleteGame.isPending}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GAMES DATABASE</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wider">Schedule & Results</p>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-card-border uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">
                <div className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Date</div>
              </th>
              <th className="px-6 py-4 font-medium">
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</div>
              </th>
              <th className="px-6 py-4 font-medium">Opponent</th>
              <th className="px-6 py-4 font-medium text-center">Result</th>
              <th className="px-6 py-4 font-medium text-right">
                <div className="flex items-center justify-end gap-1"><Hash className="w-3 h-3" /> Score</div>
              </th>
              <th className="px-6 py-4 font-medium w-12" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse font-mono">
                  FETCHING DATABASE...
                </td>
              </tr>
            ) : games && games.length > 0 ? (
              games.map(game => (
                <tr
                  key={game.id}
                  className="border-b border-card-border hover:bg-muted/20 transition-colors group"
                  onMouseEnter={() => setHoveredId(game.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    {format(new Date(game.date), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      game.homeAway === "HOME"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {game.homeAway}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">{game.opponent}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                      game.result === "W"
                        ? "text-green-500 bg-green-500/10"
                        : game.result === "L"
                        ? "text-destructive bg-destructive/10"
                        : "text-muted-foreground bg-muted"
                    }`}>
                      {game.result || "TBD"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold">
                    {game.teamScore} - {game.opponentScore}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setConfirmId(game.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-md flex items-center justify-center mx-auto bg-destructive/10 hover:bg-destructive/20 text-destructive/60 hover:text-destructive"
                      title="Remove game"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-mono border-dashed">
                  NO GAMES IN DATABASE
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
