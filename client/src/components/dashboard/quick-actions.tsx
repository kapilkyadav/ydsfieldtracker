import { Plus, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface QuickActionsProps {
  isOnDuty: boolean;
}

export function QuickActions({ isOnDuty }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="grid grid-cols-2 gap-4" data-testid="container-quick-actions">
      <Button
        variant="outline"
        className="h-14 flex flex-col items-center justify-center gap-1"
        onClick={() => setLocation("/visits/new")}
        disabled={!isOnDuty}
        data-testid="button-create-visit"
      >
        <Plus className="w-5 h-5" />
        <span className="text-xs">Create Visit</span>
      </Button>

      <Button
        variant="outline"
        className="h-14 flex flex-col items-center justify-center gap-1"
        onClick={() => setLocation("/visits")}
        data-testid="button-view-visits"
      >
        <List className="w-5 h-5" />
        <span className="text-xs">View All Visits</span>
      </Button>
    </div>
  );
}
