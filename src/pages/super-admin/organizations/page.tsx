import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated } from "convex/react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  Building2,
  Plus,
  Users,
  Globe,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Pencil,
  UserPlus,
  PowerOff,
  Clock,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

type OrgFormData = {
  name: string;
  slug: string;
  membershipPlanId: string;
  website: string;
  phone: string;
  address: string;
  maxSeats: string;
};

const DEFAULT_FORM: OrgFormData = {
  name: "",
  slug: "",
  membershipPlanId: "none",
  website: "",
  phone: "",
  address: "",
  maxSeats: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export default function OrganizationsManagementPage() {
  return (
    <Authenticated>
      <OrganizationsManagementInner />
    </Authenticated>
  );
}

function OrganizationsManagementInner() {
  const organizations = useQuery(api.organizations.listAll, { includeInactive: true });
  const userCounts = useQuery(api.organizations.getUserCounts, {});
  const plans = useQuery(api.membership.listActive, {});
  const createOrg = useMutation(api.organizations.create);
  const updateOrg = useMutation(api.organizations.update);
  const setMembershipPlan = useMutation(api.organizations.setMembershipPlan);
  const deactivateOrg = useMutation(api.organizations.deactivate);
  const activateOrg = useMutation(api.organizations.activate);
  const deleteOrg = useMutation(api.organizations.deleteOrganization);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<Id<"organizations"> | null>(null);
  const [form, setForm] = useState<OrgFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"organizations">; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editingOrg = editingId
    ? organizations?.find((o) => o._id === editingId)
    : null;

  // Map a membership plan id to its display name for the org badges.
  const planNameById = new Map(plans?.map((p) => [p._id, p.name]) ?? []);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowCreate(true);
  }

  function openEdit(id: Id<"organizations">) {
    const org = organizations?.find((o) => o._id === id);
    if (!org) return;
    setForm({
      name: org.name,
      slug: org.slug,
      membershipPlanId: org.membershipPlanId ?? "none",
      website: org.website ?? "",
      phone: org.phone ?? "",
      address: org.address ?? "",
      maxSeats: org.maxSeats ? String(org.maxSeats) : "",
    });
    setEditingId(id);
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Nama dan slug wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const planId =
        form.membershipPlanId === "none"
          ? null
          : (form.membershipPlanId as Id<"membershipPlans">);
      if (editingId) {
        await updateOrg({
          id: editingId,
          name: form.name.trim(),
          slug: form.slug.trim(),
          website: form.website || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          maxSeats: form.maxSeats ? parseInt(form.maxSeats) : undefined,
        });
        await setMembershipPlan({
          organizationId: editingId,
          membershipPlanId: planId,
        });
        toast.success("Organisasi berhasil diperbarui");
      } else {
        const newOrgId = await createOrg({
          name: form.name.trim(),
          slug: form.slug.trim(),
          website: form.website || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          maxSeats: form.maxSeats ? parseInt(form.maxSeats) : undefined,
        });
        if (planId) {
          await setMembershipPlan({
            organizationId: newOrgId,
            membershipPlanId: planId,
          });
        }
        toast.success("Organisasi berhasil dibuat");
      }
      setShowCreate(false);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Terjadi kesalahan");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: Id<"organizations">) {
    try {
      await deactivateOrg({ id });
      toast.success("Organisasi dinonaktifkan");
    } catch {
      toast.error("Gagal menonaktifkan organisasi");
    }
  }

  async function handleActivate(id: Id<"organizations">) {
    try {
      await activateOrg({ id });
      toast.success("Organisasi diaktifkan");
    } catch {
      toast.error("Gagal mengaktifkan organisasi");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrg({ id: deleteTarget.id });
      toast.success("Organisasi berhasil dihapus");
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal menghapus organisasi");
      }
    } finally {
      setDeleting(false);
    }
  }

  const isLoading = organizations === undefined;
  const activeCount = organizations?.filter((o) => o.isActive).length ?? 0;
  const totalUsers = Object.values(userCounts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Organisasi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola semua tenant/organisasi yang menggunakan platform ini
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Organisasi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Organisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? "—" : organizations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{isLoading ? "—" : activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userCounts === undefined ? "—" : totalUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Org List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Building2 /></EmptyMedia>
            <EmptyTitle>Belum ada organisasi</EmptyTitle>
            <EmptyDescription>Buat organisasi pertama untuk memulai</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openCreate} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Tambah Organisasi
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => {
            const memberCount = userCounts?.[org._id] ?? 0;
            return (
              <Card key={org._id} className={!org.isActive ? "opacity-60" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{org.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {org.membershipPlanId
                              ? (planNameById.get(org.membershipPlanId) ?? "Paket dihapus")
                              : "Tanpa Paket"}
                          </Badge>
                          {org.isActive ? (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-amber-700 bg-amber-100 border-amber-200">
                              <Clock className="w-3 h-3 mr-1" /> Menunggu Aktivasi
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/{org.slug}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {memberCount} pengguna
                          </span>
                          {org.website && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <a href={org.website} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-[200px]">
                                {org.website}
                              </a>
                            </span>
                          )}
                          {org.maxSeats && (
                            <span className="text-xs">Maks. {org.maxSeats} kursi</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="cursor-pointer shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(org._id)} className="cursor-pointer">
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {!org.isActive && (
                          <DropdownMenuItem
                            onClick={() => void handleActivate(org._id)}
                            className="cursor-pointer text-emerald-600"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Aktifkan
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => void handleDeactivate(org._id)}
                          disabled={!org.isActive}
                          className="cursor-pointer text-destructive"
                        >
                          <PowerOff className="w-4 h-4 mr-2" /> Nonaktifkan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget({ id: org._id, name: org.name })}
                          className="cursor-pointer text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Hapus Permanen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? `Edit: ${editingOrg?.name ?? ""}` : "Tambah Organisasi Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Organisasi *</Label>
              <Input
                placeholder="PT Maju Jaya"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editingId ? f.slug : slugify(name),
                  }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL) *</Label>
              <Input
                placeholder="pt-maju-jaya"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">Hanya huruf kecil, angka, dan tanda hubung</p>
            </div>
            <div className="space-y-1.5">
              <Label>Paket Keanggotaan</Label>
              <Select
                value={form.membershipPlanId}
                onValueChange={(v) => setForm((f) => ({ ...f, membershipPlanId: v }))}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Paket</SelectItem>
                  {plans?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Paket menentukan akses fitur, batas karyawan, dan penyimpanan. Kelola daftar paket di tab Keanggotaan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telepon</Label>
                <Input
                  placeholder="021-12345678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input
                placeholder="Jl. Contoh No. 1, Jakarta"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Maks. Kursi (opsional)</Label>
              <Input
                type="number"
                placeholder="100"
                value={form.maxSeats}
                onChange={(e) => setForm((f) => ({ ...f, maxSeats: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="cursor-pointer">
              {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Organisasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Hapus Organisasi
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus organisasi <span className="font-semibold text-foreground">{deleteTarget?.name}</span> secara permanen?
            </p>
            <p className="text-sm text-destructive">
              Tindakan ini tidak dapat dibatalkan. Semua anggota organisasi ini akan dilepaskan dari organisasi.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
