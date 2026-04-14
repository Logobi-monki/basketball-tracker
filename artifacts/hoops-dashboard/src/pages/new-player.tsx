import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePlayer, getListPlayersQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, User } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name requires at least 2 characters"),
  team: z.string().min(2, "Team name requires at least 2 characters"),
  position: z.string().min(1, "Position is required"),
  number: z.coerce.number().min(0).max(99),
  season: z.string().min(4, "Season is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewPlayer() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      team: "Home Team",
      position: "",
      number: 0,
      season: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString().slice(2),
    }
  });

  const createPlayer = useCreatePlayer();

  const onSubmit = (data: FormValues) => {
    createPlayer.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "SYSTEM UPDATE", description: "Player added to database successfully." });
          queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
          setLocation("/players");
        },
        onError: (err) => {
          toast({ title: "SYSTEM ERROR", description: "Failed to inject player data.", variant: "destructive" });
          console.error(err);
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono uppercase tracking-wider mb-6">
        <Link href="/players" className="hover:text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> BACK TO ROSTER
        </Link>
        <span>/</span>
        <span className="text-foreground">NEW_PLAYER_ENTRY</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 uppercase">
          <User className="text-primary w-8 h-8" />
          Add Roster Entry
        </h1>
        <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1">Inject new personnel data into system</p>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="JOHN DOE" className="bg-background border-card-border font-medium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Franchise / Team</FormLabel>
                    <FormControl>
                      <Input className="bg-background border-card-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-card-border uppercase">
                          <SelectValue placeholder="SELECT POS" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PG">Point Guard (PG)</SelectItem>
                        <SelectItem value="SG">Shooting Guard (SG)</SelectItem>
                        <SelectItem value="SF">Small Forward (SF)</SelectItem>
                        <SelectItem value="PF">Power Forward (PF)</SelectItem>
                        <SelectItem value="C">Center (C)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Jersey Number</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="99" className="bg-background border-card-border font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs tracking-widest text-muted-foreground">Season</FormLabel>
                    <FormControl>
                      <Input className="bg-background border-card-border font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                className="uppercase tracking-widest font-bold" 
                disabled={createPlayer.isPending}
              >
                {createPlayer.isPending ? "PROCESSING..." : <><Save className="w-4 h-4 mr-2"/> INJECT DATA</>}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
