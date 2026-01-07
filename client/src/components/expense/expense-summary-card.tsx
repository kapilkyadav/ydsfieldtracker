import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExpenseClaim, ExpenseClaimStatus } from "@shared/schema";
import { format } from "date-fns";

interface ExpenseSummaryCardProps {
  claim: ExpenseClaim | null;
  isLoading?: boolean;
}

const statusConfig: Record<ExpenseClaimStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: Clock },
  SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  NEEDS_APPROVAL: { label: "Needs Review", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertTriangle },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export function ExpenseSummaryCard({ claim, isLoading }: ExpenseSummaryCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="card-expense-loading">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!claim) {
    return (
      <Card data-testid="card-expense-empty">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-3xl text-muted-foreground">receipt_long</span>
            </div>
            <p className="text-muted-foreground">No expense claim for today</p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete a duty session to generate a claim
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = claim.status as ExpenseClaimStatus;
  const config = statusConfig[status] || statusConfig.DRAFT;
  const StatusIcon = config.icon;

  const kmClaimed = parseFloat(claim.kmClaimed?.toString() || "0");
  const amountClaimed = parseFloat(claim.amountClaimed?.toString() || "0");
  const kmApproved = parseFloat(claim.kmApproved?.toString() || "0");
  const amountApproved = parseFloat(claim.amountApproved?.toString() || "0");

  const showApproved = status === "APPROVED" || status === "REJECTED";

  return (
    <Card data-testid="card-expense-summary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Today's Expense</h3>
          <Badge variant="secondary" className={cn("gap-1", config.color)} data-testid="badge-expense-status">
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold" data-testid="text-km-claimed">
              {kmClaimed.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">KM Claimed</p>
            {showApproved && kmApproved !== kmClaimed && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1" data-testid="text-km-approved">
                {kmApproved.toFixed(1)} approved
              </p>
            )}
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold" data-testid="text-amount-claimed">
              ₹{amountClaimed.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Amount</p>
            {showApproved && amountApproved !== amountClaimed && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1" data-testid="text-amount-approved">
                ₹{amountApproved.toFixed(0)} approved
              </p>
            )}
          </div>
        </div>

        {claim.businessStartAt && claim.businessEndAt && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Business hours:</span>
            <span data-testid="text-business-hours">
              {format(new Date(claim.businessStartAt), "h:mm a")} - {format(new Date(claim.businessEndAt), "h:mm a")}
            </span>
          </div>
        )}

        {status === "NEEDS_APPROVAL" && claim.exceptionReason && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg" data-testid="container-exception-reason">
            <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Manual Review Required</p>
                <p className="text-xs mt-1">{claim.exceptionReason}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
