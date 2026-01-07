import { Users, AlertTriangle, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ManagerStatsProps {
  usersOnDuty: number;
  pendingApprovals: number;
  exceptions: number;
}

export function ManagerStats({ usersOnDuty, pendingApprovals, exceptions }: ManagerStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3" data-testid="container-manager-stats">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold" data-testid="text-users-on-duty">
            {usersOnDuty}
          </p>
          <p className="text-xs text-muted-foreground">On Duty</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-2">
            <ClipboardCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold" data-testid="text-pending-approvals">
            {pendingApprovals}
          </p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold" data-testid="text-exceptions">
            {exceptions}
          </p>
          <p className="text-xs text-muted-foreground">Exceptions</p>
        </CardContent>
      </Card>
    </div>
  );
}
