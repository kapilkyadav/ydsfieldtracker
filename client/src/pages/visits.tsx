import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { VisitList } from "@/components/visits/visit-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import type { Visit } from "@shared/schema";

export default function VisitsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("today");

  const { data: todayVisits, isLoading: loadingToday } = useQuery<(Visit & { clientName?: string; projectCode?: string })[]>({
    queryKey: ["/api/visits", "today"],
  });

  const { data: upcomingVisits, isLoading: loadingUpcoming } = useQuery<(Visit & { clientName?: string; projectCode?: string })[]>({
    queryKey: ["/api/visits", "upcoming"],
  });

  return (
    <AppLayout title="Visits">
      <div className="flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="sticky top-0 z-20 bg-background border-b border-border">
            <TabsList className="w-full h-12 p-0 bg-transparent rounded-none">
              <TabsTrigger
                value="today"
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-today"
              >
                Today
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                data-testid="tab-upcoming"
              >
                Upcoming
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="flex-1 m-0">
            <VisitList
              visits={todayVisits || []}
              isLoading={loadingToday}
              emptyMessage="No visits scheduled for today"
            />
          </TabsContent>

          <TabsContent value="upcoming" className="flex-1 m-0">
            <VisitList
              visits={upcomingVisits || []}
              isLoading={loadingUpcoming}
              emptyMessage="No upcoming visits scheduled"
            />
          </TabsContent>
        </Tabs>

        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-30"
          onClick={() => setLocation("/visits/new")}
          data-testid="button-fab-create-visit"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
