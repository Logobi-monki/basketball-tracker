import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Users, LayoutDashboard, CalendarDays, Radio } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/players", label: "Roster", icon: Users },
    { href: "/games", label: "Games", icon: CalendarDays },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col shrink-0">
        <div className="h-14 flex items-center px-6 border-b border-sidebar-border gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-bold text-sidebar-foreground tracking-tight">HOOPS ANALYTICS</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-4">
          <Link
            href="/game-mode"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-sm font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <Radio className="w-4 h-4" />
            Game Mode
          </Link>
        </div>
        <div className="px-4 pb-4 border-t border-sidebar-border pt-4 text-xs text-muted-foreground font-mono">
          SYSTEM_STATUS: ONLINE
          <br />
          VERSION: 1.0.0
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
