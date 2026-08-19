import React from "react";
import { Clock, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";

export default function PendingApprovalPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="max-w-md w-full text-center shadow-lg border-muted">
        <CardHeader className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Clock className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account request has been submitted and is currently being reviewed by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2 justify-center">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>You will receive an email once your access is approved.</span>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={() => window.location.reload()}>
            <Mail className="w-4 h-4" /> Check Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
