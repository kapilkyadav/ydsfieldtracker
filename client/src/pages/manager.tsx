import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { ManagerStats } from "@/components/manager/manager-stats";
import { PendingApprovalCard } from "@/components/manager/pending-approval-card";
import { AssignVisitForm } from "@/components/manager/assign-visit-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Client, Project, ExpenseClaim } from "@shared/schema";

interface ManagerDashboardData {
  usersOnDuty: number;
  pendingApprovals: number;
  exceptions: number;
  pendingClaims: {
    id: string;
    userId: string;
    userName: string;
    sessionDate: Date;
    kmClaimed: number;
    amountClaimed: number;
    status: string;
    exceptionReason: string | null;
    visitCount: number;
  }[];
}

export default function ManagerPage() {
  const { isManager } = useAuth();
  const { toast } = useToast();
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery<ManagerDashboardData>({
    queryKey: ["/api/dashboard/manager"],
    enabled: isManager,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isManager,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isManager,
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isManager,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, action, kmApproved, amountApproved, note }: {
      id: string;
      action: string;
      kmApproved?: number;
      amountApproved?: number;
      note?: string;
    }) => {
      setProcessingClaimId(id);
      const response = await apiRequest("POST", `/api/expenses/${id}/approve`, {
        action,
        kmApproved,
        amountApproved,
        note,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Action failed");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/manager"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/pending"] });
      const actionText = variables.action === "APPROVE" ? "approved" : variables.action === "REJECT" ? "rejected" : "adjusted";
      toast({
        title: "Expense " + actionText.charAt(0).toUpperCase() + actionText.slice(1),
        description: `The expense claim has been ${actionText}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setProcessingClaimId(null);
    },
  });

  const assignVisitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/visits/assign", {
        ...data,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        plannedStartAt: data.plannedStartAt || null,
        clientId: data.clientId || null,
        projectId: data.projectId || null,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign visit");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Visit Assigned",
        description: "The visit has been assigned to the team member",
      });
      setIsAssignFormOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Assign Visit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string, note?: string) => {
    approveMutation.mutate({ id, action: "APPROVE", note });
  };

  const handleReject = (id: string, note: string) => {
    approveMutation.mutate({ id, action: "REJECT", note });
  };

  const handleAdjust = (id: string, kmApproved: number, amountApproved: number, note: string) => {
    approveMutation.mutate({ id, action: "ADJUST", kmApproved, amountApproved, note });
  };

  if (!isManager) {
    return (
      <AppLayout title="Manager Panel">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Manager role required.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Manager Panel">
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {loadingDashboard ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <ManagerStats
            usersOnDuty={dashboardData?.usersOnDuty || 0}
            pendingApprovals={dashboardData?.pendingApprovals || 0}
            exceptions={dashboardData?.exceptions || 0}
          />
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Team Actions</h2>
        </div>

        <Button
          className="w-full"
          onClick={() => setIsAssignFormOpen(true)}
          data-testid="button-open-assign-form"
        >
          <Plus className="w-4 h-4 mr-2" />
          Assign Visit to Team Member
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingDashboard ? (
              <div className="p-4 space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
            ) : dashboardData?.pendingClaims && dashboardData.pendingClaims.length > 0 ? (
              <div className="p-4 space-y-4">
                {dashboardData.pendingClaims.map((claim) => (
                  <PendingApprovalCard
                    key={claim.id}
                    claim={claim}
                    isProcessing={processingClaimId === claim.id}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onAdjust={handleAdjust}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <span className="material-icons text-2xl text-muted-foreground">check_circle</span>
                </div>
                <p className="text-muted-foreground text-sm" data-testid="text-no-pending">
                  No pending approvals
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <AssignVisitForm
          isOpen={isAssignFormOpen}
          onClose={() => setIsAssignFormOpen(false)}
          users={users || []}
          clients={clients || []}
          projects={projects || []}
          isSubmitting={assignVisitMutation.isPending}
          onSubmit={(data) => assignVisitMutation.mutate(data)}
        />
      </div>
    </AppLayout>
  );
}
