import { User, MapPin, AlertTriangle, Check, X, Edit2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PendingApprovalCardProps {
  claim: {
    id: string;
    userId: string;
    userName: string;
    sessionDate: Date;
    kmClaimed: number;
    amountClaimed: number;
    status: string;
    exceptionReason?: string | null;
    visitCount: number;
  };
  isProcessing: boolean;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, note: string) => void;
  onAdjust: (id: string, kmApproved: number, amountApproved: number, note: string) => void;
}

export function PendingApprovalCard({
  claim,
  isProcessing,
  onApprove,
  onReject,
  onAdjust,
}: PendingApprovalCardProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [adjustKm, setAdjustKm] = useState(claim.kmClaimed.toString());
  const [adjustNote, setAdjustNote] = useState("");

  const initials = claim.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleApprove = () => {
    onApprove(claim.id);
  };

  const handleReject = () => {
    if (rejectNote.trim()) {
      onReject(claim.id, rejectNote.trim());
      setRejectNote("");
      setIsRejectDialogOpen(false);
    }
  };

  const handleAdjust = () => {
    const km = parseFloat(adjustKm);
    if (!isNaN(km) && adjustNote.trim()) {
      const amount = km * 10; // rate_per_km = 10
      onAdjust(claim.id, km, amount, adjustNote.trim());
      setAdjustNote("");
      setIsAdjustDialogOpen(false);
    }
  };

  const hasException = claim.status === "NEEDS_APPROVAL" && claim.exceptionReason;

  return (
    <Card className={cn(hasException && "border-yellow-300 dark:border-yellow-800")} data-testid={`card-approval-${claim.id}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium" data-testid={`text-user-name-${claim.id}`}>
                {claim.userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(claim.sessionDate), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {hasException && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Exception
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold" data-testid={`text-visits-${claim.id}`}>
              {claim.visitCount}
            </p>
            <p className="text-xs text-muted-foreground">Visits</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold" data-testid={`text-km-${claim.id}`}>
              {claim.kmClaimed.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">KM</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold" data-testid={`text-amount-${claim.id}`}>
              ₹{claim.amountClaimed.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Amount</p>
          </div>
        </div>

        {hasException && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
            <p className="font-medium">Exception Reason:</p>
            <p className="text-xs mt-1">{claim.exceptionReason}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={isProcessing}
            data-testid={`button-approve-${claim.id}`}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            Approve
          </Button>

          <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setIsAdjustDialogOpen(true)}
              disabled={isProcessing}
              data-testid={`button-adjust-${claim.id}`}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Adjust
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Approved KM</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={adjustKm}
                    onChange={(e) => setAdjustKm(e.target.value)}
                    data-testid="input-adjust-km"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Amount: ₹{(parseFloat(adjustKm) * 10 || 0).toFixed(0)} (at ₹10/km)
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Note (Required)</label>
                  <Textarea
                    placeholder="Reason for adjustment..."
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    data-testid="input-adjust-note"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleAdjust}
                  disabled={!adjustNote.trim() || isNaN(parseFloat(adjustKm))}
                  data-testid="button-confirm-adjust"
                >
                  Confirm Adjustment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isProcessing}
              data-testid={`button-reject-${claim.id}`}
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Expense</DialogTitle>
              </DialogHeader>
              <div>
                <label className="text-sm font-medium">Reason (Required)</label>
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  data-testid="input-reject-note"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectNote.trim()}
                  data-testid="button-confirm-reject"
                >
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
