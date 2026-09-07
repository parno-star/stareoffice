import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useMemo, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader,
  Trash2,
  X,
  Ticket as TicketIcon,
} from "lucide-react";
import CreateTicketDialog from "./_components/CreateTicketDialog.tsx";
import TicketCard from "./_components/TicketCard.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { STATUS_CONFIG, STATUS_ORDER } from "./_lib/support-utils.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketList({
  scope,
  statusFilter,
  showAuthor,
}: {
  scope: "mine" | "all";
  statusFilter: string;
  showAuthor?: boolean;
}) {
  const tickets = useQuery(api.tickets.listTickets, {
    scope,
    status: statusFilter,
  });
  const bulkRemove = useMutation(api.tickets.bulkRemoveTickets);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"tickets">>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const ticketIds = useMemo(
    () => (tickets ?? []).map((t) => t._id),
    [tickets],
  );
  const allSelected =
    ticketIds.length > 0 && selectedIds.size === ticketIds.length;

  const toggleSelect = (id: Id<"tickets">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === ticketIds.length ? new Set() : new Set(ticketIds),
    );
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const res = await bulkRemove({ ticketIds: Array.from(selectedIds) });
      if (res.skipped > 0) {
        toast.success(
          `${res.deleted} tiket dihapus, ${res.skipped} dilewati (tanpa izin).`,
        );
      } else {
        toast.success(`${res.deleted} tiket berhasil dihapus.`);
      }
      setConfirmOpen(false);
      exitSelection();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus tiket");
      } else {
        toast.error("Gagal menghapus tiket");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (tickets === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TicketIcon />
          </EmptyMedia>
          <EmptyTitle>
            {scope === "mine"
              ? statusFilter === "all"
                ? "Belum ada tiket"
                : "Tidak ada tiket dengan status ini"
              : "Tidak ada tiket"}
          </EmptyTitle>
          <EmptyDescription>
            {scope === "mine" && statusFilter === "all"
              ? 'Klik "Buat Tiket" untuk mengirim permintaan bantuan pertama.'
              : "Coba ubah filter untuk melihat tiket lainnya."}
          </EmptyDescription>
        </EmptyHeader>
        {scope === "mine" && statusFilter === "all" ? (
          <EmptyContent>
            <CreateTicketDialog />
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {selectionMode ? (
          <>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                className="cursor-pointer"
                aria-label="Pilih semua tiket"
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} dipilih
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedIds.size === 0}
                onClick={() => setConfirmOpen(true)}
                className="gap-1.5"
              >
                <Trash2 className="size-4" />
                Hapus ({selectedIds.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelection}
                className="gap-1.5 text-muted-foreground"
              >
                <X className="size-4" />
                Batal
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectionMode(true)}
            className="ml-auto gap-1.5"
          >
            <Trash2 className="size-4" />
            Pilih & Hapus
          </Button>
        )}
      </div>

      {tickets.map((t) => (
        <TicketCard
          key={t._id}
          ticket={t}
          showAuthor={showAuthor}
          selectable={selectionMode}
          selected={selectedIds.has(t._id)}
          onToggleSelect={toggleSelect}
        />
      ))}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} tiket?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiket yang dipilih beserta seluruh komentarnya akan dihapus
              permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              disabled={deleting}
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SupportPage() {
  const stats = useQuery(api.tickets.getStats, {});
  const [mineStatus, setMineStatus] = useState<string>("all");
  const [allStatus, setAllStatus] = useState<string>("open");

  const isAdmin = stats?.isAdmin ?? false;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bantuan IT</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Laporkan kendala teknis dan lacak status permintaan bantuan Anda.
          </p>
        </div>
        <CreateTicketDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="Tiket Saya Terbuka"
          value={stats?.myOpen ?? "-"}
          accent="bg-sky-500/15 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          icon={Loader}
          label="Sedang Dikerjakan"
          value={stats?.myInProgress ?? "-"}
          accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tiket Selesai"
          value={stats?.myResolved ?? "-"}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={HelpCircle}
          label={isAdmin ? "Total Antrian IT" : "Tim IT Siap Membantu"}
          value={isAdmin ? (stats?.allOpen ?? "-") : "24/5"}
          accent="bg-primary/15 text-primary"
        />
      </div>

      {/* Tabs */}
      {isAdmin ? (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">Tiket Saya</TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              Semua Tiket
              {stats && stats.allOpen > 0 ? (
                <Badge variant="destructive" className="h-5 px-1.5">
                  {stats.allOpen}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4 space-y-4">
            <StatusFilter value={mineStatus} onChange={setMineStatus} />
            <TicketList scope="mine" statusFilter={mineStatus} />
          </TabsContent>
          <TabsContent value="all" className="mt-4 space-y-4">
            <StatusFilter value={allStatus} onChange={setAllStatus} />
            <TicketList scope="all" statusFilter={allStatus} showAuthor />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <StatusFilter value={mineStatus} onChange={setMineStatus} />
          <TicketList scope="mine" statusFilter={mineStatus} />
        </div>
      )}
    </div>
  );
}

function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Status:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua status</SelectItem>
          {STATUS_ORDER.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <SelectItem key={s} value={s}>
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {cfg.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
