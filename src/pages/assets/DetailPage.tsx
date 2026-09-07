import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
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
  ArrowLeft,
  Hash,
  Calendar,
  MapPin,
  DollarSign,
  Tag,
  Pencil,
  Trash2,
  UserCheck,
  RotateCcw,
  History,
  Package,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { isAdminRole } from "@/convex/roles.ts";
import AssetFormDialog from "./_components/AssetFormDialog.tsx";
import AssignAssetDialog from "./_components/AssignAssetDialog.tsx";
import ReturnAssetDialog from "./_components/ReturnAssetDialog.tsx";
import {
  formatIdr,
  getCategoryConfig,
  getStatusConfig,
} from "./_lib/asset-utils.ts";

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}

function formatDate(d: string | undefined): string {
  if (!d) return "-";
  try {
    return format(new Date(d), "d MMM yyyy", { locale: idLocale });
  } catch {
    return d;
  }
}

function formatDateTime(d: string | undefined): string {
  if (!d) return "-";
  try {
    return format(new Date(d), "d MMM yyyy, HH:mm", { locale: idLocale });
  } catch {
    return d;
  }
}

export default function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const typedId = assetId as Id<"assets">;

  const asset = useQuery(api.assets.getById, { id: typedId });
  const history = useQuery(api.assets.listAssignmentsForAsset, {
    assetId: typedId,
  });
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const canManage = isAdminRole(currentUser?.role ?? null);

  const removeAsset = useMutation(api.assets.remove);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (asset === undefined) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (asset === null) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <Package className="size-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Aset tidak ditemukan</h2>
        <Button onClick={() => navigate("/assets")}>
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const cat = getCategoryConfig(asset.category);
  const status = getStatusConfig(asset.status);
  const CatIcon = cat.icon;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeAsset({ id: typedId });
      toast.success("Aset dihapus");
      navigate("/assets");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus aset");
      } else {
        toast.error("Gagal menghapus aset");
      }
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Breadcrumb */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/assets")}
        className="cursor-pointer gap-2"
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar aset
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden pt-0">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted lg:aspect-[21/6]">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${cat.bg}`}
            >
              <CatIcon className={`size-24 ${cat.color}`} />
            </div>
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={status.color} variant="outline">
              {status.label}
            </Badge>
            <Badge className={`${cat.bg} ${cat.color} border-transparent`}>
              <CatIcon className="size-3.5" />
              {cat.label}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="size-3.5" />
                <span className="font-mono">{asset.assetTag}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {asset.name}
              </h1>
              {asset.brand || asset.model ? (
                <p className="text-sm text-muted-foreground">
                  {[asset.brand, asset.model].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
            {canManage ? (
              <div className="flex flex-wrap items-center gap-2">
                {asset.status === "assigned" ? (
                  <Button
                    onClick={() => setReturnOpen(true)}
                    className="cursor-pointer gap-2"
                  >
                    <RotateCcw className="size-4" />
                    Kembalikan
                  </Button>
                ) : asset.status === "available" ||
                  asset.status === "in_repair" ? (
                  <Button
                    onClick={() => setAssignOpen(true)}
                    className="cursor-pointer gap-2"
                    disabled={asset.status === "in_repair"}
                    title={
                      asset.status === "in_repair"
                        ? "Aset sedang diperbaiki"
                        : undefined
                    }
                  >
                    <UserCheck className="size-4" />
                    Tugaskan
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer gap-2"
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteOpen(true)}
                  className="cursor-pointer gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={asset.status === "assigned"}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Detail info */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Tag className="size-4" />
              Informasi Aset
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Nomor Seri</dt>
                <dd className="text-sm font-medium">
                  {asset.serialNumber || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Lokasi</dt>
                <dd className="flex items-center gap-1 text-sm font-medium">
                  {asset.location ? (
                    <>
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {asset.location}
                    </>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tanggal Beli</dt>
                <dd className="flex items-center gap-1 text-sm font-medium">
                  {asset.purchaseDate ? (
                    <>
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {formatDate(asset.purchaseDate)}
                    </>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Harga Beli</dt>
                <dd className="flex items-center gap-1 text-sm font-medium">
                  {asset.purchasePrice !== undefined ? (
                    <>
                      <DollarSign className="size-3.5 text-muted-foreground" />
                      {formatIdr(asset.purchasePrice)}
                    </>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
            </dl>
            {asset.description ? (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <FileText className="size-3.5" />
                  Catatan
                </div>
                <p className="whitespace-pre-wrap text-sm">
                  {asset.description}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Current holder */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <UserCheck className="size-4" />
              Pemegang Saat Ini
            </h2>
            {asset.currentHolderName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={asset.currentHolderAvatar ?? undefined}
                    />
                    <AvatarFallback>
                      {initialsOf(asset.currentHolderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {asset.currentHolderName}
                    </p>
                    {asset.currentHolderDepartment ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {asset.currentHolderDepartment}
                      </p>
                    ) : null}
                  </div>
                </div>
                {asset.assignedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Ditugaskan sejak {formatDateTime(asset.assignedAt)}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aset sedang tidak ditugaskan kepada karyawan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment history */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <History className="size-4" />
            Riwayat Penugasan
          </h2>
          {history === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (history ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada riwayat penugasan.
            </p>
          ) : (
            <div className="space-y-2">
              {(history ?? []).map((h) => (
                <div
                  key={h._id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={h.userAvatar ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {initialsOf(h.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {h.userName ?? "Tanpa nama"}
                      </span>
                      {!h.returnedAt ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                        >
                          Sedang dipegang
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {h.returnCondition === "lost"
                            ? "Hilang"
                            : h.returnCondition === "damaged"
                              ? "Dikembalikan rusak"
                              : "Dikembalikan"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(h.assignedAt)}
                      {h.returnedAt
                        ? ` · dikembalikan ${formatDateTime(h.returnedAt)}`
                        : ""}
                      {h.assignedByName
                        ? ` · oleh ${h.assignedByName}`
                        : ""}
                    </p>
                    {h.note ? (
                      <p className="rounded bg-muted/50 px-2 py-1 text-xs">
                        {h.note}
                      </p>
                    ) : null}
                    {h.returnNote ? (
                      <p className="rounded bg-muted/50 px-2 py-1 text-xs">
                        <span className="font-medium">Catatan kembali:</span>{" "}
                        {h.returnNote}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AssetFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={asset}
      />
      <AssignAssetDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assetId={typedId}
        assetName={asset.name}
      />
      <ReturnAssetDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        assetId={typedId}
        assetName={asset.name}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus aset ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Aset dan seluruh riwayat penugasannya akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
