import { useLocation, Link } from "wouter";
import { Home, MapPin, Receipt, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
  requiresManager?: boolean;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/visits", label: "Visits", icon: MapPin },
  { path: "/expense", label: "Expense", icon: Receipt },
  { path: "/manager", label: "Manager", icon: Users, requiresManager: true },
];

export function BottomNav() {
  const [location] = useLocation();
  const { isManager } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.requiresManager || isManager
  );

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/dashboard" && location.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover-elevate"
                )}
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 mb-1",
                    isActive && "fill-primary/20"
                  )} 
                />
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
