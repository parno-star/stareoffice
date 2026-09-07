import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  ErrorState,
  ErrorStateHeader,
  ErrorStateMedia,
  ErrorStateTitle,
  ErrorStateDescription,
  ErrorStateContent,
} from "@/components/ui/error-state.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ArrowLeft,
  MapPin,
  Plane,
  CalendarDays,
  Wallet,
  Hotel,
  FileText,
  Flag,
  Check,
  X,
  Play,
  Send,
  Trash2,
  AlertTriangle,
  Clock3,
} from "lucide-react";
import {
  formatRange,
  formatDateLong,
  formatCurrency,
  getStatusConfig,
  getTransportConfig,
} from "./_lib/travel-utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import ReviewTravelDialog from "./_components/ReviewTravelDialog.tsx";
import TravelReportDialog from "./_components/TravelReportDialog.tsx";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function ItineraryTimeline({
  items,
  startDate,
  endDate,
}: {
  items: Array<Doc<"travelItineraryItems">>;
  startDate: string;
  endDate: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Belum ada rencana itinerary untuk perjalanan ini.
      </div>
    );
  }

  // Group by date
  const groups = new Map<string, Array<Doc<"travelItineraryItems">>>();
  for (const item of items) {
    const list = groups.get(item.date) ?? [];
    list.push(item);
    groups.set(item.date, list);
  }

  const sortedDates = [...groups.keys()].sort();

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dayItems = groups.get(date) ?? [];
        const isWithinRange = date >= startDate && date <= endDate;
        return (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarDays className="size-4" />
              </div>
              <div>
                <p className="font-semibold">{formatDateLong(date)}</p>
                {!isWithinRange ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Di luar rentang perjalanan
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2 pl-5">
              {dayItems.map((item) => (
                <div
                  key={item._id}
                  className="relative rounded-lg border bg-card p-3 before:absolute before:-left-[14px] before:top-4 before:h-2 before:w-2 before:rounded-full before:bg-primary"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{item.activity}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" />
                        <span>{item.location}</span>
                      </div>
                    </div>
                    {item.timeStart || item.timeEnd ? (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Clock3 className="size-3" />
                        {item.timeStart ?? "--"}
                        {item.timeEnd ? ` - ${item.timeEnd}` : ""}
                      </Badge>
                    ) : null}
                  </div>
                  {item.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailPageInner({
  requestId,
}: {
  requestId: Id<"travelRequests">;
}) {
  const data = useQuery(api.travel.getById, { id: requestId });
  const navigate = useNavigate();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");
  const [reportOpen, setReportOpen] = useState(false);

  const cancelMut = useMutation(api.travel.cancel);
  const submitDraft = useMutation(api.travel.submitDraft);
  const markInProgress = useMutation(api.travel.markInProgress);
  const removeMut = useMutation(api.travel.remove);

  if (data === undefined) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="p-6">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon">
              <AlertTriangle />
            </ErrorStateMedia>
            <ErrorStateTitle>Perjalanan tidak ditemukan</ErrorStateTitle>
            <ErrorStateDescription>
              Pengajuan yang Anda cari tidak ada atau telah dihapus.
            </ErrorStateDescription>
          </ErrorStateHeader>
          <ErrorStateContent>
            <Button size="sm" onClick={() => navigate("/travel")}>
              Kembali
            </Button>
          </ErrorStateContent>
        </ErrorState>
      </div>
    );
  }

  const { request, itinerary, canApprove, canEdit } = data;
  const transport = getTransportConfig(request.transportMode);
  const status = getStatusConfig(request.status);
  const TransportIcon = transport.icon;
  const StatusIcon = status.icon;

  const canSubmitDraft = canEdit && request.status === "draft";
  const canCancel =
    request.status !== "completed" &&
    request.status !== "cancelled" &&
    request.status !== "rejected";
  const canMarkInProgress = request.status === "approved";
  const canSubmitReport =
    request.status === "approved" || request.status === "in_progress";

  const handleAction = async (
    fn: () => Promise<unknown>,
    msg: string,
    redirect?: string,
  ) => {
    try {
      await fn();
      toast.success(msg);
      if (redirect) navigate(redirect);
    } catch (error) {
      if (error instanceof ConvexError) {
        const d = error.data as { message?: string };
        toast.error(d.message ?? "Gagal memproses");
      } else {
        toast.error("Gagal memproses");
      }
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/travel")}
        className="gap-1 cursor-pointer"
      >
        <ArrowLeft className="size-4" />
        Kembali ke Daftar
      </Button>

      <Card>
        <CardContent className="space-y-4 p-4 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${transport.iconBg}`}
              >
                <TransportIcon className="size-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight">
                  {request.title}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{request.destination}</span>
                  <span>·</span>
                  <CalendarDays className="size-4" />
                  <span>{formatRange(request.startDate, request.endDate)}</span>
                  <span>·</span>
                  <span>{request.dayCount} hari</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={`${status.badge} gap-1`}>
              <StatusIcon className="size-3.5" />
              {status.label}
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Transportasi</p>
              <p className="mt-0.5 font-semibold">{transport.label}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Wallet className="size-3.5" /> Estimasi
              </p>
              <p className="mt-0.5 font-semibold">
                {formatCurrency(request.estimatedCost, request.currency ?? "IDR")}
              </p>
            </div>
            {request.accommodation ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Hotel className="size-3.5" /> Akomodasi
                </p>
                <p className="mt-0.5 truncate font-semibold">
                  {request.accommodation}
                </p>
              </div>
            ) : null}
            {request.actualCost !== undefined ? (
              <div className="rounded-md border border-violet-500/20 bg-violet-500/5 p-3 text-sm">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flag className="size-3.5" /> Biaya Aktual
                </p>
                <p className="mt-0.5 font-semibold">
                  {formatCurrency(
                    request.actualCost,
                    request.currency ?? "IDR",
                  )}
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              TUJUAN / ALASAN PERJALANAN
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
              {request.purpose}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
            <Avatar className="size-9">
              <AvatarImage src={request.userAvatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(request.userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium">{request.userName}</p>
              <p className="text-xs text-muted-foreground">
                {request.userJobTitle ?? ""}
                {request.userJobTitle && request.userDepartment ? " · " : ""}
                {request.userDepartment ?? ""}
              </p>
            </div>
            {request.approverName ? (
              <div className="ml-auto text-xs text-right">
                <p className="text-muted-foreground">Penyetuju</p>
                <p className="font-medium">{request.approverName}</p>
              </div>
            ) : null}
          </div>

          {request.status === "rejected" && request.rejectionReason ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold text-destructive">Alasan ditolak</p>
              <p className="mt-1 text-muted-foreground">
                {request.rejectionReason}
              </p>
            </div>
          ) : null}
          {request.approvalNote && request.status !== "rejected" ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                Catatan Penyetuju
              </p>
              <p className="mt-1 text-muted-foreground">
                {request.approvalNote}
              </p>
            </div>
          ) : null}

          {/* Actions row */}
          <div className="flex flex-wrap gap-2 pt-2">
            {canApprove ? (
              <>
                <Button
                  onClick={() => {
                    setReviewMode("approve");
                    setReviewOpen(true);
                  }}
                  className="gap-1 cursor-pointer"
                >
                  <Check className="size-4" />
                  Setujui
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setReviewMode("reject");
                    setReviewOpen(true);
                  }}
                  className="gap-1 cursor-pointer"
                >
                  <X className="size-4" />
                  Tolak
                </Button>
              </>
            ) : null}
            {canSubmitDraft ? (
              <Button
                onClick={() =>
                  handleAction(
                    () => submitDraft({ id: request._id }),
                    "Pengajuan dikirim untuk persetujuan",
                  )
                }
                className="gap-1 cursor-pointer"
              >
                <Send className="size-4" />
                Kirim Pengajuan
              </Button>
            ) : null}
            {canMarkInProgress ? (
              <Button
                variant="secondary"
                onClick={() =>
                  handleAction(
                    () => markInProgress({ id: request._id }),
                    "Perjalanan ditandai sedang berjalan",
                  )
                }
                className="gap-1 cursor-pointer"
              >
                <Play className="size-4" />
                Mulai Perjalanan
              </Button>
            ) : null}
            {canSubmitReport ? (
              <Button
                onClick={() => setReportOpen(true)}
                className="gap-1 cursor-pointer"
              >
                <Flag className="size-4" />
                Kirim Laporan
              </Button>
            ) : null}
            {canCancel && canEdit ? (
              <Button
                variant="ghost"
                onClick={() =>
                  handleAction(
                    () => cancelMut({ id: request._id }),
                    "Perjalanan dibatalkan",
                  )
                }
                className="gap-1 cursor-pointer"
              >
                <X className="size-4" />
                Batalkan
              </Button>
            ) : null}
            {request.status === "draft" || request.status === "cancelled" ? (
              <Button
                variant="ghost"
                onClick={() =>
                  handleAction(
                    () => removeMut({ id: request._id }),
                    "Pengajuan dihapus",
                    "/travel",
                  )
                }
                className="gap-1 cursor-pointer text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Hapus
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="size-4" />
            Rencana Itinerary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ItineraryTimeline
            items={itinerary}
            startDate={request.startDate}
            endDate={request.endDate}
          />
        </CardContent>
      </Card>

      {request.reportSummary ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Laporan Perjalanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Estimasi awal</p>
                <p className="mt-0.5 text-sm font-semibold">
                  {formatCurrency(
                    request.estimatedCost,
                    request.currency ?? "IDR",
                  )}
                </p>
              </div>
              <div className="rounded-md border bg-violet-500/5 p-3">
                <p className="text-xs text-muted-foreground">Biaya aktual</p>
                <p className="mt-0.5 text-sm font-semibold">
                  {formatCurrency(
                    request.actualCost ?? 0,
                    request.currency ?? "IDR",
                  )}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                RINGKASAN
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {request.reportSummary}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ReviewTravelDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        requestId={request._id}
        mode={reviewMode}
        title={request.title}
      />
      <TravelReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        requestId={request._id}
        title={request.title}
        estimatedCost={request.estimatedCost}
        currency={request.currency ?? "IDR"}
      />
    </div>
  );
}

export default function TravelDetailPage() {
  const params = useParams();
  const id = params.requestId as Id<"travelRequests"> | undefined;
  if (!id) {
    return (
      <div className="p-6">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon">
              <AlertTriangle />
            </ErrorStateMedia>
            <ErrorStateTitle>URL tidak valid</ErrorStateTitle>
            <ErrorStateDescription>
              Tautan perjalanan tidak valid. Kembali ke daftar perjalanan.
            </ErrorStateDescription>
          </ErrorStateHeader>
        </ErrorState>
      </div>
    );
  }

  return (
    <>
      <AuthLoading>
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk melihat detail perjalanan.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <DetailPageInner requestId={id} />
      </Authenticated>
    </>
  );
}
