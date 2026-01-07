import { MapPin, Briefcase, Building, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Visit, VisitStatus, VisitType } from "@shared/schema";
import { format } from "date-fns";

interface VisitCardProps {
  visit: Visit & { clientName?: string; projectCode?: string };
  onClick?: () => void;
}

const statusColors: Record<VisitStatus, string> = {
  PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const typeIcons: Record<VisitType, typeof Briefcase> = {
  SALES_MEETING: Briefcase,
  SITE_VISIT: Building,
};

const typeColors: Record<VisitType, string> = {
  SALES_MEETING: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  SITE_VISIT: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
};

export function VisitCard({ visit, onClick }: VisitCardProps) {
  const TypeIcon = typeIcons[visit.visitType as VisitType];
  const status = visit.status as VisitStatus;
  const visitType = visit.visitType as VisitType;

  return (
    <div
      className="p-4 border-b border-border hover-elevate active-elevate-2 cursor-pointer"
      onClick={onClick}
      data-testid={`card-visit-${visit.id}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            typeColors[visitType]
          )}
        >
          <TypeIcon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate" data-testid={`text-visit-title-${visit.id}`}>
              {visit.title}
            </h3>
            <Badge
              variant="secondary"
              className={cn("text-xs flex-shrink-0", statusColors[status])}
              data-testid={`badge-visit-status-${visit.id}`}
            >
              {status.replace("_", " ")}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {visit.clientName && (
              <span className="truncate">{visit.clientName}</span>
            )}
            {visit.projectCode && (
              <>
                <span className="text-border">|</span>
                <span className="truncate">{visit.projectCode}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {visit.plannedStartAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(visit.plannedStartAt), "h:mm a")}</span>
              </div>
            )}
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{visit.locationAddressText}</span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
}
