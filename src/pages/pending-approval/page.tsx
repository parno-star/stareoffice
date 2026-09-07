import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Clock, ShieldX, RefreshCw, LogOut } from "lucide-react";
import { ROLE_LABELS, normalizeRole } from "@/convex/roles.ts";
import { ROLE_COLORS } from "@/pages/settings/users/_lib/role-ui.ts";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useState } from "react";
import RoleRequestDialog from "@/components/role-request-dialog.tsx";
import { useAuth } from "@/hooks/use-auth.ts";

export default function PendingApprovalScreen() {
  const { removeUser } = useAuth();
  const request = useQuery(api.roleRequests.getMyPendingRequest, {});
  const [showResubmit, setShowResubmit] = useState(false);

  const isRejected = request?.status === "rejected";
  const isPending = request?.status === "pending" || !request;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className={cn(
              "flex size-20 items-center justify-center rounded-full",
              isRejected
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
            )}
          >
            {isRejected ? (
              <ShieldX className="size-10" />
            ) : (
              <Clock className="size-10" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {isRejected ? "Permintaan Ditolak" : "Menunggu Persetujuan"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRejected
              ? "Permintaan peran Anda ditolak oleh administrator. Anda dapat mengajukan ulang dengan peran yang berbeda."
              : "Permintaan peran Anda sedang ditinjau oleh administrator. Halaman ini akan otomatis diperbarui setelah disetujui."}
          </p>
        </div>

        {/* Request detail card */}
        {request && (
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Detail Permintaan
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peran diminta</span>
              <Badge
                variant="outline"
                className={cn("border", ROLE_COLORS[normalizeRole(request.requestedRole)])}
              >
                {ROLE_LABELS[normalizeRole(request.requestedRole)]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={
                  request.status === "approved"
                    ? "default"
                    : request.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {request.status === "pending"
                  ? "Menunggu"
                  : request.status === "approved"
                    ? "Disetujui"
                    : "Ditolak"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dikirim</span>
              <span className="text-sm font-medium">
                {format(new Date(request.requestedAt), "d MMM yyyy, HH:mm", { locale: localeId })}
              </span>
            </div>
            {request.reason && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Keterangan:</p>
                <p className="mt-1 text-sm">{request.reason}</p>
              </div>
            )}
            {isRejected && request.reviewNote && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">Catatan Administrator:</p>
                <p className="mt-1 text-sm">{request.reviewNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isRejected && (
            <Button
              className="w-full gap-2"
              onClick={() => setShowResubmit(true)}
            >
              <RefreshCw className="size-4" />
              Ajukan Ulang
            </Button>
          )}
          {isPending && (
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="size-4" />
              Periksa Status
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={async () => { try { await removeUser(); } catch { /* ignore */ } window.location.replace("/"); }}
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </div>

      {showResubmit && (
        <RoleRequestDialog
          open={showResubmit}
          onClose={() => setShowResubmit(false)}
          isResubmit
        />
      )}
    </div>
  );
}
