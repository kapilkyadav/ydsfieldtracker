import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { ExpenseSummaryCard } from "@/components/expense/expense-summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ExpenseClaim } from "@shared/schema";

interface ExpenseHistoryItem extends ExpenseClaim {
  sessionDate: string;
}

export default function ExpensePage() {
  const { data: todayClaim, isLoading: loadingToday } = useQuery<ExpenseClaim | null>({
    queryKey: ["/api/expenses/mine", "today"],
  });

  const { data: history, isLoading: loadingHistory } = useQuery<ExpenseHistoryItem[]>({
    queryKey: ["/api/expenses/mine", "history"],
  });

  return (
    <AppLayout title="Expense">
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        <ExpenseSummaryCard claim={todayClaim || null} isLoading={loadingToday} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingHistory ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted-foreground/20 rounded w-24" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-16" />
                    </div>
                    <div className="h-6 bg-muted-foreground/20 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="divide-y divide-border">
                {history.map((item) => {
                  const km = parseFloat(item.kmClaimed?.toString() || "0");
                  const amount = parseFloat(item.amountClaimed?.toString() || "0");
                  const statusColors: Record<string, string> = {
                    DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                    SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    NEEDS_APPROVAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                    APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  };

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4"
                      data-testid={`expense-history-${item.id}`}
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(item.sessionDate || item.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {km.toFixed(1)} km | ₹{amount.toFixed(0)}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={statusColors[item.status] || ""}
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No expense history yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
