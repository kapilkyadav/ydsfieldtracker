import { MapPin, Briefcase, Building, Clock, User, ExternalLink, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Visit, VisitStatus, VisitType } from "@shared/schema";
import { format } from "date-fns";

interface VisitDetailCardProps {
  visit: Visit & { clientName?: string; projectCode?: string };
}

const statusColors: Record<VisitStatus, string> = {
  PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const typeLabels: Record<VisitType, string> = {
  SALES_MEETING: "Sales Meeting",
  SITE_VISIT: "Site Visit",
};

const typeColors: Record<VisitType, string> = {
  SALES_MEETING: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  SITE_VISIT: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
};

export function VisitDetailCard({ visit }: VisitDetailCardProps) {
  const status = visit.status as VisitStatus;
  const visitType = visit.visitType as VisitType;

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${visit.locationLat},${visit.locationLng}`;
    window.open(url, "_blank");
  };

  return (
    <Card data-testid="card-visit-detail">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge
              variant="secondary"
              className={cn("mb-2", typeColors[visitType])}
              data-testid="badge-visit-type"
            >
              {visitType === "SALES_MEETING" ? (
                <Briefcase className="w-3 h-3 mr-1" />
              ) : (
                <Building className="w-3 h-3 mr-1" />
              )}
              {typeLabels[visitType]}
            </Badge>
            <h2 className="text-xl font-semibold" data-testid="text-visit-detail-title">
              {visit.title}
            </h2>
          </div>
          <Badge
            variant="secondary"
            className={cn(statusColors[status])}
            data-testid="badge-visit-detail-status"
          >
            {status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
          onClick={openInMaps}
          data-testid="button-open-maps"
        >
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-blue-600/30">
            <div className="text-center">
              <Navigation className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
              <p className="text-sm font-medium text-foreground">Tap to open in Google Maps</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {visit.clientName && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium" data-testid="text-visit-client">
                {visit.clientName}
              </p>
            </div>
          )}

          {visit.projectCode && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Project</p>
              <p className="text-sm font-medium" data-testid="text-visit-project">
                {visit.projectCode}
              </p>
            </div>
          )}

          {visit.plannedStartAt && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span data-testid="text-visit-scheduled">
                  {format(new Date(visit.plannedStartAt), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Geofence</p>
            <p className="text-sm font-medium" data-testid="text-visit-geofence">
              {visit.geofenceRadiusM}m radius
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Location</p>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm" data-testid="text-visit-address">
              {visit.locationAddressText}
            </p>
          </div>
        </div>

        {visit.purpose && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Purpose</p>
            <p className="text-sm" data-testid="text-visit-purpose">
              {visit.purpose}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
