import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { CreateVisitForm } from "@/components/visits/create-visit-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client, Project } from "@shared/schema";

export default function VisitCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createVisitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/visits", {
        ...data,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        plannedStartAt: data.plannedStartAt || null,
        clientId: data.clientId || null,
        projectId: data.projectId || null,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create visit");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      toast({
        title: "Visit Created",
        description: "Your visit has been scheduled",
      });
      setLocation("/visits");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Visit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AppLayout title="Create Visit">
      <div className="p-4 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => setLocation("/visits")}
          data-testid="button-back-from-create"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <CreateVisitForm
          clients={clients || []}
          projects={projects || []}
          isSubmitting={createVisitMutation.isPending}
          onSubmit={(data) => createVisitMutation.mutate(data)}
          onCancel={() => setLocation("/visits")}
        />
      </div>
    </AppLayout>
  );
}
