import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardCheck,
  ArrowRight,
  User,
  Trash2,
  UserCog,
  History,
  Paperclip,
  Download,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { cn } from "@/lib/utils.ts";

const FIELD_LABELS: Record<string, string> = {
  name: "Nama",
  jobTitle: "Jabatan",
  department: "Departemen",
  phone: "Telepon",
  location: "Lokasi",
  bio: "Tentang Saya",
  birthday: "Ulang Tahun",
  startDate: "Mulai Bekerja",
};

type ChangeRequest = {
  _id: Id<"profileChangeRequests">;
  userId: Id<"users">;
  status: string;
  changes: Record<string, string>;
  fieldLabels?: Record<string, string>;
  userName: string;
  userEmail: string;
  userDepartment: string;
  userJobTitle: string;
  createdAt: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewerName?: string;
};

type HistoryRequest = {
  _id: Id<"historyChangeRequests">;
  userId: Id<"users">;
  kind: string;
  action: string;
  status: string;
  summary: string;
  payload: string;
  attachmentName?: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  kindLabel: string;
  actionLabel: string;
  createdAt: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewerName?: string;
};

export default function ProfileVerificationPage() {
  const [source, setSource] = useState<"profile" | "history">("profile");
  const [activeTab, setActiveTab] = useState("pending");

  const profilePending = useQuery(api.profileChangeRequests.countPending, {});
  const historyPending = useQuery(api.historyChangeRequests.countPending, {});

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="size-6 text-primary" />
        <h1 className="text-xl font-bold">Verifikasi Data Karyawan</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Tinjau dan verifikasi permintaan perubahan data profil dan riwayat
        karyawan sebelum diterapkan ke sistem.
      </p>

      {/* Source toggle */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={source === "profile" ? "default" : "secondary"}
          className="gap-2"
          onClick={() => setSource("profile")}
        >
          <UserCog className="size-4" />
          Data Profil
          {profilePending && profilePending > 0 ? (
            <Badge
              variant="destructive"
              className="ml-1 h-5 min-w-5 px-1.5 text-xs"
            >
              {profilePending}
            </Badge>
          ) : null}
        </Button>
        <Button
          size="sm"
          variant={source === "history" ? "default" : "secondary"}
          className="gap-2"
          onClick={() => setSource("history")}
        >
          <History className="size-4" />
          Riwayat Karyawan
          {historyPending && historyPending > 0 ? (
            <Badge
              variant="destructive"
              className="ml-1 h-5 min-w-5 px-1.5 text-xs"
            >
              {historyPending}
            </Badge>
          ) : null}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="cursor-pointer gap-2">
            <Clock className="size-3.5" />
            Menunggu
          </TabsTrigger>
          <TabsTrigger value="approved" className="cursor-pointer gap-2">
            <CheckCircle2 className="size-3.5" />
            Disetujui
          </TabsTrigger>
          <TabsTrigger value="rejected" className="cursor-pointer gap-2">
            <XCircle className="size-3.5" />
            Ditolak
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {source === "profile" ? (
            <RequestList status="pending" />
          ) : (
            <HistoryRequestList status="pending" />
          )}
        </TabsContent>
        <TabsContent value="approved">
          {source === "profile" ? (
            <RequestList status="approved" />
          ) : (
            <HistoryRequestList status="approved" />
          )}
        </TabsContent>
        <TabsContent value="rejected">
          {source === "profile" ? (
            <RequestList status="rejected" />
          ) : (
            <HistoryRequestList status="rejected" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestList({ status }: { status: string }) {
  const requests = useQuery(api.profileChangeRequests.listAll, { status });

  if (requests === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return <EmptyState status={status} />;
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <RequestCard key={req._id} request={req as ChangeRequest} />
      ))}
    </div>
  );
}

function EmptyState({ status }: { status: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClipboardCheck />
        </EmptyMedia>
        <EmptyTitle>
          {status === "pending"
            ? "Tidak ada permintaan menunggu"
            : status === "approved"
              ? "Belum ada yang disetujui"
              : "Belum ada yang ditolak"}
        </EmptyTitle>
        <EmptyDescription>
          {status === "pending"
            ? "Semua permintaan sudah ditinjau."
            : "Permintaan yang telah ditinjau akan muncul di sini."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div />
      </EmptyContent>
    </Empty>
  );
}

const STATUS_COLOR = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={STATUS_COLOR[status as keyof typeof STATUS_COLOR] ?? ""}
    >
      {status === "pending"
        ? "Menunggu"
        : status === "approved"
          ? "Disetujui"
          : "Ditolak"}
    </Badge>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RequestCard({ request }: { request: ChangeRequest }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const approve = useMutation(api.profileChangeRequests.approve);
  const reject = useMutation(api.profileChangeRequests.reject);
  const remove = useMutation(api.profileChangeRequests.remove);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await approve({ requestId: request._id });
      toast.success(`Perubahan profil ${request.userName} telah disetujui`);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menyetujui");
      } else {
        toast.error("Gagal menyetujui permintaan");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await reject({ requestId: request._id, reason: reason.trim() || undefined });
      toast.success(`Perubahan profil ${request.userName} telah ditolak`);
      setRejectOpen(false);
      setReason("");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menolak");
      } else {
        toast.error("Gagal menolak permintaan");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await remove({ requestId: request._id });
      toast.success(`Permintaan ${request.userName} telah dihapus`);
      setDeleteOpen(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus permintaan");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <User className="size-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">{request.userName}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {request.userJobTitle || request.userDepartment
                    ? `${request.userJobTitle ?? ""}${request.userJobTitle && request.userDepartment ? " — " : ""}${request.userDepartment ?? ""}`
                    : request.userEmail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} />
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={processing}
                aria-label="Hapus permintaan"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Changes list */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Perubahan yang Diminta
            </p>
            <div className="space-y-1.5">
              {Object.entries(request.changes).map(([field, value]) => (
                <div key={field} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">
                    {request.fieldLabels?.[field] ?? FIELD_LABELS[field] ?? field}:
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="font-medium">{value || "(kosong)"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Diajukan: {formatDateTime(request.createdAt)}</span>
            {request.reviewedAt && (
              <span>
                Ditinjau: {formatDateTime(request.reviewedAt)}
                {request.reviewerName ? ` oleh ${request.reviewerName}` : ""}
              </span>
            )}
          </div>

          {/* Rejection reason */}
          {request.status === "rejected" && request.rejectionReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              <span className="font-medium">Alasan penolakan:</span> {request.rejectionReason}
            </div>
          )}

          {/* Actions for pending requests */}
          {request.status === "pending" && (
            <ActionButtons
              processing={processing}
              onApprove={handleApprove}
              onReject={() => setRejectOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        reason={reason}
        setReason={setReason}
        processing={processing}
        onConfirm={handleReject}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={request.userName}
        processing={processing}
        onConfirm={handleDelete}
      />
    </>
  );
}

function HistoryRequestList({ status }: { status: string }) {
  const requests = useQuery(api.historyChangeRequests.listAll, { status });

  if (requests === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return <EmptyState status={status} />;
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <HistoryRequestCard key={req._id} request={req as HistoryRequest} />
      ))}
    </div>
  );
}

const ACTION_COLOR: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// Fields that we surface as a readable preview of the requested change.
const HISTORY_FIELD_LABELS: Record<string, string> = {
  institution: "Institusi",
  degree: "Jenjang",
  fieldOfStudy: "Jurusan",
  title: "Judul",
  name: "Nama",
  organizer: "Penyelenggara",
  issuer: "Pemberi",
  organization: "Organisasi",
  role: "Peran",
  position: "Jabatan",
  category: "Kategori",
  level: "Tingkat",
  location: "Lokasi",
  description: "Deskripsi",
  startYear: "Tahun Mulai",
  endYear: "Tahun Selesai",
  startDate: "Tanggal Mulai",
  endDate: "Tanggal Selesai",
  awardDate: "Tanggal",
  trainingDate: "Tanggal",
  duration: "Durasi",
  certificateNumber: "No. Sertifikat",
};

function historyPreview(payload: string): Array<[string, string]> {
  try {
    const obj = JSON.parse(payload) as Record<string, unknown>;
    const entries: Array<[string, string]> = [];
    for (const [key, value] of Object.entries(obj)) {
      if (
        key.startsWith("attachment") ||
        key === "removeAttachment" ||
        value === undefined ||
        value === null ||
        value === ""
      ) {
        continue;
      }
      const label = HISTORY_FIELD_LABELS[key] ?? key;
      entries.push([label, String(value)]);
    }
    return entries.slice(0, 8);
  } catch {
    return [];
  }
}

function HistoryRequestCard({ request }: { request: HistoryRequest }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const approve = useMutation(api.historyChangeRequests.approve);
  const reject = useMutation(api.historyChangeRequests.reject);
  const remove = useMutation(api.historyChangeRequests.remove);

  const preview = request.action === "delete" ? [] : historyPreview(request.payload);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await approve({ requestId: request._id });
      toast.success(`Perubahan riwayat ${request.userName} telah disetujui`);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menyetujui");
      } else {
        toast.error("Gagal menyetujui permintaan");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await reject({ requestId: request._id, reason: reason.trim() || undefined });
      toast.success(`Perubahan riwayat ${request.userName} telah ditolak`);
      setRejectOpen(false);
      setReason("");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menolak");
      } else {
        toast.error("Gagal menolak permintaan");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await remove({ requestId: request._id });
      toast.success(`Permintaan ${request.userName} telah dihapus`);
      setDeleteOpen(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus permintaan");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <User className="size-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">{request.userName}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {request.userDepartment || request.userEmail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} />
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={processing}
                aria-label="Hapus permintaan"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Change summary */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(ACTION_COLOR[request.action] ?? "")}
            >
              {request.actionLabel}
            </Badge>
            <Badge variant="outline">{request.kindLabel}</Badge>
            <span className="text-sm text-muted-foreground">
              {request.summary}
            </span>
          </div>

          {/* Field preview */}
          {preview.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detail
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {preview.map(([label, value]) => (
                  <div key={label} className="flex gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">
                      {label}:
                    </span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachment */}
          {request.attachmentName && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <Paperclip className="size-3.5 text-muted-foreground" />
              <span className="truncate">{request.attachmentName}</span>
              <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
                <Download className="size-3" />
                Dilampirkan
              </Badge>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Diajukan: {formatDateTime(request.createdAt)}</span>
            {request.reviewedAt && (
              <span>
                Ditinjau: {formatDateTime(request.reviewedAt)}
                {request.reviewerName ? ` oleh ${request.reviewerName}` : ""}
              </span>
            )}
          </div>

          {/* Rejection reason */}
          {request.status === "rejected" && request.rejectionReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              <span className="font-medium">Alasan penolakan:</span>{" "}
              {request.rejectionReason}
            </div>
          )}

          {request.status === "pending" && (
            <ActionButtons
              processing={processing}
              onApprove={handleApprove}
              onReject={() => setRejectOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        reason={reason}
        setReason={setReason}
        processing={processing}
        onConfirm={handleReject}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={request.userName}
        processing={processing}
        onConfirm={handleDelete}
      />
    </>
  );
}

function ActionButtons({
  processing,
  onApprove,
  onReject,
}: {
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <Button size="sm" onClick={onApprove} disabled={processing} className="gap-1.5">
        <CheckCircle2 className="size-3.5" />
        Setujui
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onReject}
        disabled={processing}
        className="gap-1.5"
      >
        <XCircle className="size-3.5" />
        Tolak
      </Button>
    </div>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  reason,
  setReason,
  processing,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  setReason: (v: string) => void;
  processing: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tolak Permintaan</DialogTitle>
          <DialogDescription>
            Berikan alasan penolakan agar karyawan mengetahui penyebabnya
            (opsional).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Contoh: Data tidak sesuai dengan dokumen pendukung..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={processing}>
            {processing ? "Menolak..." : "Tolak Permintaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  onOpenChange,
  name,
  processing,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  processing: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Permintaan</DialogTitle>
          <DialogDescription>
            Permintaan dari {name} akan dihapus permanen dan tidak dapat
            dikembalikan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={processing}>
            {processing ? "Menghapus..." : "Hapus Permintaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
