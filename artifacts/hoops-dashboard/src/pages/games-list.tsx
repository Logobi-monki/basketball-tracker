import { useListGames } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Hash } from "lucide-react";

export default function GamesList() {
  const { data: games, isLoading } = useListGames();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GAMES DATABASE</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-wider">Schedule & Results</p>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-card-border uppercase">
            <tr>
              <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Date</div></th>
              <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</div></th>
              <th className="px-6 py-4 font-medium">Opponent</th>
              <th className="px-6 py-4 font-medium text-center">Result</th>
              <th className="px-6 py-4 font-medium text-right"><div className="flex items-center justify-end gap-1"><Hash className="w-3 h-3"/> Score</div></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground animate-pulse font-mono">FETCHING DATABASE...</td></tr>
            ) : games && games.length > 0 ? (
              games.map(game => (
                <tr key={game.id} className="border-b border-card-border hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    {format(new Date(game.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${game.homeAway === 'HOME' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {game.homeAway}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {game.opponent}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded ${game.result === 'W' ? 'text-green-500 bg-green-500/10' : game.result === 'L' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted'}`}>
                      {game.result || 'TBD'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold">
                    {game.teamScore} - {game.opponentScore}
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-mono border-dashed">NO GAMES IN DATABASE</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
