import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { VisitDetailCard } from "@/components/visits/visit-detail-card";
import { CheckInSection } from "@/components/visits/check-in-section";
import { ProofSection } from "@/components/visits/proof-section";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentPosition, isWithinGeofence, haversineDistance, type GeoPosition } from "@/lib/geolocation";
import { useToast } from "@/hooks/use-toast";
import type { Visit, VisitEvent } from "@shared/schema";

interface VisitDetailResponse {
  visit: Visit & { clientName?: string; projectCode?: string };
  events: VisitEvent[];
}

export default function VisitDetailPage() {
  const [, params] = useRoute("/visits/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const visitId = params?.id;

  const [currentPosition, setCurrentPosition] = useState<GeoPosition | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [isWithinGeo, setIsWithinGeo] = useState(false);

  const { data, isLoading } = useQuery<VisitDetailResponse>({
    queryKey: ["/api/visits", visitId],
    enabled: !!visitId,
  });

  const visit = data?.visit;
  const events = data?.events || [];

  const refreshLocation = useCallback(async () => {
    if (!visit) return;
    setIsLoadingPosition(true);
    try {
      const position = await getCurrentPosition();
      setCurrentPosition(position);
      
      const targetLat = parseFloat(visit.locationLat?.toString() || "0");
      const targetLng = parseFloat(visit.locationLng?.toString() || "0");
      const distanceKm = haversineDistance(position.lat, position.lng, targetLat, targetLng);
      const distanceM = distanceKm * 1000;
      setDistanceToTarget(distanceM);
      setIsWithinGeo(isWithinGeofence(position.lat, position.lng, targetLat, targetLng, visit.geofenceRadiusM || 150));
    } catch (error) {
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Failed to get location",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPosition(false);
    }
  }, [visit, toast]);

  useEffect(() => {
    if (visit && (visit.status === "PLANNED" || visit.status === "IN_PROGRESS")) {
      refreshLocation();
    }
  }, [visit, refreshLocation]);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!currentPosition || !visitId) throw new Error("Position required");
      const response = await apiRequest("POST", `/api/visits/${visitId}/checkin`, {
        lat: currentPosition.lat.toString(),
        lng: currentPosition.lng.toString(),
        accuracyM: currentPosition.accuracy.toString(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Check-in failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", visitId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      toast({
        title: "Checked In",
        description: "You have successfully checked in to this visit",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!currentPosition || !visitId) throw new Error("Position required");
      const response = await apiRequest("POST", `/api/visits/${visitId}/checkout`, {
        lat: currentPosition.lat.toString(),
        lng: currentPosition.lng.toString(),
        accuracyM: currentPosition.accuracy.toString(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Check-out failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", visitId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      toast({
        title: "Checked Out",
        description: "Visit completed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await fetch(`/api/visits/${visitId}/photo`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("yds_auth") ? JSON.parse(localStorage.getItem("yds_auth")!).token : ""}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload photo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", visitId] });
      toast({
        title: "Photo Added",
        description: "Photo uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await apiRequest("POST", `/api/visits/${visitId}/note`, { note });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add note");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", visitId] });
      toast({
        title: "Note Added",
        description: "Note saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasPhoto = events.some((e) => e.eventType === "PHOTO" && e.photoUrl);
  const hasNote = events.some((e) => e.eventType === "NOTE" && e.note);
  const hasRequiredProof = hasPhoto && hasNote;
  const canAddProof = visit?.status === "IN_PROGRESS";

  if (isLoading || !visit) {
    return (
      <AppLayout title="Visit Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Visit Details">
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => setLocation("/visits")}
          data-testid="button-back-visits"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Visits
        </Button>

        <VisitDetailCard visit={visit} />

        <CheckInSection
          visitStatus={visit.status}
          currentPosition={currentPosition}
          distanceToTarget={distanceToTarget}
          geofenceRadius={visit.geofenceRadiusM || 150}
          isWithinGeofence={isWithinGeo}
          isLoadingPosition={isLoadingPosition}
          isCheckingIn={checkInMutation.isPending}
          isCheckingOut={checkOutMutation.isPending}
          onCheckIn={() => checkInMutation.mutate()}
          onCheckOut={() => checkOutMutation.mutate()}
          onRefreshLocation={refreshLocation}
          hasRequiredProof={hasRequiredProof}
        />

        <ProofSection
          events={events}
          canAddProof={canAddProof}
          isAddingPhoto={addPhotoMutation.isPending}
          isAddingNote={addNoteMutation.isPending}
          onAddPhoto={(file) => addPhotoMutation.mutate(file)}
          onAddNote={(note) => addNoteMutation.mutate(note)}
        />
      </div>
    </AppLayout>
  );
}
