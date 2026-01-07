import { Play, Square, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatAccuracy, getAccuracyBgColor, getAccuracyColor, getAccuracyStatus } from "@/lib/geolocation";

interface DutyStatusCardProps {
  isOnDuty: boolean;
  sessionStartTime?: Date;
  lastAccuracy?: number;
  isLoading?: boolean;
  onStartDay: () => void;
  onEndDay: () => void;
}

export function DutyStatusCard({
  isOnDuty,
  sessionStartTime,
  lastAccuracy,
  isLoading = false,
  onStartDay,
  onEndDay,
}: DutyStatusCardProps) {
  const formatDuration = (startTime: Date): string => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="shadow-lg" data-testid="card-duty-status">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isOnDuty ? "bg-green-500" : "bg-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-xl font-semibold",
                isOnDuty ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}
              data-testid="text-duty-status"
            >
              {isOnDuty ? "On Duty" : "Off Duty"}
            </span>
          </div>
          
          {lastAccuracy !== undefined && isOnDuty && (
            <Badge
              variant="secondary"
              className={cn(
                "gap-1",
                getAccuracyBgColor(lastAccuracy),
                getAccuracyColor(lastAccuracy)
              )}
              data-testid="badge-gps-accuracy"
            >
              <MapPin className="w-3 h-3" />
              {formatAccuracy(lastAccuracy)}
              {getAccuracyStatus(lastAccuracy) === "poor" && " (Poor)"}
            </Badge>
          )}
        </div>

        {isOnDuty && sessionStartTime && (
          <div className="flex items-center gap-2 mb-6 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Session time:</span>
            <span className="text-lg font-mono font-medium text-foreground" data-testid="text-session-duration">
              {formatDuration(sessionStartTime)}
            </span>
          </div>
        )}

        <Button
          size="lg"
          className={cn(
            "w-full h-12 text-base font-medium",
            isOnDuty
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          )}
          onClick={isOnDuty ? onEndDay : onStartDay}
          disabled={isLoading}
          data-testid={isOnDuty ? "button-end-day" : "button-start-day"}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isOnDuty ? "Ending..." : "Starting..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {isOnDuty ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isOnDuty ? "End Day" : "Start Day"}
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
