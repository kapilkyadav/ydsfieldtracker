import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { DutyStatusCard } from "@/components/dashboard/duty-status-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { VisitList } from "@/components/visits/visit-list";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentPosition, type GeoPosition } from "@/lib/geolocation";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { DutySession, Visit, ExpenseClaim } from "@shared/schema";

interface SessionResponse {
  session: DutySession | null;
  visitsToday: (Visit & { clientName?: string; projectCode?: string })[];
  expenseClaim: ExpenseClaim | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lastAccuracy, setLastAccuracy] = useState<number | undefined>();
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/sessions/today"],
    refetchInterval: 30000,
  });

  const isOnDuty = data?.session?.status === "OPEN";
  const sessionStartTime = data?.session?.startAt ? new Date(data.session.startAt) : undefined;

  const startDayMutation = useMutation({
    mutationFn: async (position: GeoPosition) => {
      const response = await apiRequest("POST", "/api/sessions/start", {
        lat: position.lat.toString(),
        lng: position.lng.toString(),
        accuracyM: position.accuracy.toString(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start day");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      toast({
        title: "Day Started",
        description: "Your duty session has begun. Stay safe!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Start Day",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const endDayMutation = useMutation({
    mutationFn: async (position: GeoPosition) => {
      const response = await apiRequest("POST", `/api/sessions/${data?.session?.id}/end`, {
        lat: position.lat.toString(),
        lng: position.lng.toString(),
        accuracyM: position.accuracy.toString(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to end day");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/mine"] });
      toast({
        title: "Day Ended",
        description: "Your duty session has ended. Great work today!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to End Day",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pingMutation = useMutation({
    mutationFn: async (position: GeoPosition) => {
      if (!data?.session?.id) return;
      const response = await apiRequest("POST", `/api/sessions/${data.session.id}/ping`, {
        lat: position.lat.toString(),
        lng: position.lng.toString(),
        accuracyM: position.accuracy.toString(),
      });
      return response.json();
    },
    onSuccess: (_, position) => {
      setLastAccuracy(position.accuracy);
    },
  });

  const handleStartDay = async () => {
    try {
      const position = await getCurrentPosition();
      setLastAccuracy(position.accuracy);
      startDayMutation.mutate(position);
    } catch (error) {
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Failed to get location",
        variant: "destructive",
      });
    }
  };

  const handleEndDay = async () => {
    try {
      const position = await getCurrentPosition();
      endDayMutation.mutate(position);
    } catch (error) {
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Failed to get location",
        variant: "destructive",
      });
    }
  };

  const sendPing = useCallback(async () => {
    if (!isOnDuty || document.visibilityState !== "visible") return;
    try {
      const position = await getCurrentPosition();
      pingMutation.mutate(position);
    } catch (error) {
      console.error("Ping failed:", error);
    }
  }, [isOnDuty, pingMutation]);

  useEffect(() => {
    if (isOnDuty) {
      sendPing();
      pingIntervalRef.current = setInterval(sendPing, 60000);
    }

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [isOnDuty, sendPing]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isOnDuty) {
        sendPing();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isOnDuty, sendPing]);

  const completedVisits = data?.visitsToday?.filter((v) => v.status === "COMPLETED").length || 0;
  const kmToday = parseFloat(data?.expenseClaim?.kmClaimed?.toString() || "0");
  const recentVisits = data?.visitsToday?.slice(0, 3) || [];

  return (
    <AppLayout 
      title="Dashboard" 
      isOnDuty={isOnDuty} 
      showGPSBanner={isOnDuty}
    >
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        <DutyStatusCard
          isOnDuty={isOnDuty}
          sessionStartTime={sessionStartTime}
          lastAccuracy={lastAccuracy}
          isLoading={startDayMutation.isPending || endDayMutation.isPending}
          onStartDay={handleStartDay}
          onEndDay={handleEndDay}
        />

        <StatsGrid visitsToday={completedVisits} kmToday={kmToday} />

        <QuickActions isOnDuty={isOnDuty} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Visits</h2>
            <Link href="/visits" className="flex items-center text-sm text-primary">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <VisitList
            visits={recentVisits}
            isLoading={isLoading}
            emptyMessage="No visits scheduled for today"
          />
        </div>
      </div>
    </AppLayout>
  );
}
