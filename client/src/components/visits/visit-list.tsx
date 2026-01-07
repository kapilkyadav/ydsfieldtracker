import { VisitCard } from "./visit-card";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Visit } from "@shared/schema";

interface VisitListProps {
  visits: (Visit & { clientName?: string; projectCode?: string })[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function VisitList({ visits, isLoading, emptyMessage = "No visits found" }: VisitListProps) {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="material-icons text-3xl text-muted-foreground">event_busy</span>
        </div>
        <p className="text-muted-foreground" data-testid="text-empty-visits">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border" data-testid="container-visit-list">
      {visits.map((visit) => (
        <VisitCard
          key={visit.id}
          visit={visit}
          onClick={() => setLocation(`/visits/${visit.id}`)}
        />
      ))}
    </div>
  );
}
