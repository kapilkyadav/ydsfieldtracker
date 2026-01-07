import { MapPin, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsGridProps {
  visitsToday: number;
  kmToday: number;
}

export function StatsGrid({ visitsToday, kmToday }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4" data-testid="container-stats-grid">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-visits-today">
                {visitsToday}
              </p>
              <p className="text-xs text-muted-foreground">Visits Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-km-today">
                {kmToday.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">KM Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
