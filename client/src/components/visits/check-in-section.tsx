import { MapPin, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatAccuracy, getAccuracyBgColor, getAccuracyColor } from "@/lib/geolocation";
import type { GeoPosition } from "@/lib/geolocation";

interface CheckInSectionProps {
  visitStatus: string;
  currentPosition: GeoPosition | null;
  distanceToTarget: number | null;
  geofenceRadius: number;
  isWithinGeofence: boolean;
  isLoadingPosition: boolean;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onRefreshLocation: () => void;
  hasRequiredProof: boolean;
}

export function CheckInSection({
  visitStatus,
  currentPosition,
  distanceToTarget,
  geofenceRadius,
  isWithinGeofence,
  isLoadingPosition,
  isCheckingIn,
  isCheckingOut,
  onCheckIn,
  onCheckOut,
  onRefreshLocation,
  hasRequiredProof,
}: CheckInSectionProps) {
  const canCheckIn = visitStatus === "PLANNED" && isWithinGeofence && currentPosition && currentPosition.accuracy <= 80;
  const canCheckOut = visitStatus === "IN_PROGRESS" && hasRequiredProof;
  const isCompleted = visitStatus === "COMPLETED";
  const isCancelled = visitStatus === "CANCELLED" || visitStatus === "NO_SHOW";

  if (isCompleted) {
    return (
      <Card className="border-green-200 dark:border-green-800" data-testid="card-checkin-completed">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">Visit Completed</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isCancelled) {
    return (
      <Card className="border-red-200 dark:border-red-800" data-testid="card-checkin-cancelled">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <XCircle className="w-6 h-6" />
            <span className="font-medium">Visit {visitStatus.replace("_", " ")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-checkin-section">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Location Check</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshLocation}
            disabled={isLoadingPosition}
            data-testid="button-refresh-location"
          >
            {isLoadingPosition ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-xs">Refresh</span>
            )}
          </Button>
        </div>

        {currentPosition ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">GPS Accuracy:</span>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  getAccuracyBgColor(currentPosition.accuracy),
                  getAccuracyColor(currentPosition.accuracy)
                )}
                data-testid="badge-current-accuracy"
              >
                {formatAccuracy(currentPosition.accuracy)}
              </Badge>
            </div>

            {distanceToTarget !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Distance to location:</span>
                <span className="text-sm font-medium" data-testid="text-distance-to-target">
                  {distanceToTarget < 1000
                    ? `${Math.round(distanceToTarget)}m`
                    : `${(distanceToTarget / 1000).toFixed(1)}km`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Geofence status:</span>
              {isWithinGeofence ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" data-testid="badge-geofence-ok">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Within {geofenceRadius}m
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" data-testid="badge-geofence-outside">
                  <XCircle className="w-3 h-3 mr-1" />
                  Outside geofence
                </Badge>
              )}
            </div>

            {currentPosition.accuracy > 80 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400" data-testid="alert-poor-accuracy">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs">
                  GPS accuracy is too low. Move to an open area and retry.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            {isLoadingPosition ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Getting location...</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap refresh to get your current location
              </p>
            )}
          </div>
        )}

        {visitStatus === "PLANNED" && (
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={onCheckIn}
            disabled={!canCheckIn || isCheckingIn}
            data-testid="button-check-in"
          >
            {isCheckingIn ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking in...
              </span>
            ) : (
              "Check In"
            )}
          </Button>
        )}

        {visitStatus === "IN_PROGRESS" && (
          <div className="space-y-3">
            {!hasRequiredProof && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400" data-testid="alert-proof-required">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs">
                  Add at least 1 photo and 1 note before checking out
                </p>
              </div>
            )}
            <Button
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={onCheckOut}
              disabled={!canCheckOut || isCheckingOut}
              data-testid="button-check-out"
            >
              {isCheckingOut ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking out...
                </span>
              ) : (
                "Check Out"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
