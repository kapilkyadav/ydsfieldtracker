import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface GPSBannerProps {
  isOnDuty: boolean;
}

export function GPSBanner({ isOnDuty }: GPSBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isOnDuty) {
        setIsDismissed(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isOnDuty]);

  if (!isOnDuty || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div 
      className="sticky top-14 z-30 bg-yellow-500 dark:bg-yellow-600 text-black px-4 py-2 flex items-center gap-3"
      data-testid="banner-gps-warning"
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">
        Keep app open during travel for accurate expense tracking
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-black hover:bg-yellow-400 dark:hover:bg-yellow-500"
        onClick={() => setIsDismissed(true)}
        data-testid="button-dismiss-gps-banner"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
