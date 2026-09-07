import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog.tsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog.tsx";
import { Building2, Plus, Pencil, Trash2, UserCheck, Sparkles, Wand2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

type AddMode = "auto" | "manual";

type FormData = {
  name: string;
  type: "jasa" | "manufaktur";
  code: string;
  headName: string;
  isActive: boolean;
  order: string;
};
const EMPTY_FORM: FormData = { name: "", type: "jasa", code: "", headName: "", isActive: true, order: "1" };

export default function DivisionsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<Doc<"bodDivisions"> | null>(null);
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [addMode, setAddMode]       = useState<AddMode>("auto");

  const divisions = useQuery(api.bodExtended.getDivisions, {});
  const userDept  = useQuery(api.bodExtended.getCurrentUserDeptInfo, {});
  const upsert    = useMutation(api.bodExtended.upsertDivision);
  const remove    = useMutation(api.bodExtended.deleteDivision);

  function openNew(mode: AddMode) {
    setEditing(null);
    setAddMode(mode);
    const nextOrder = String((divisions?.length ?? 0) + 1);
    if (mode === "auto" && userDept) {
      setForm({
        ...EMPTY_FORM,
        order:    nextOrder,
        name:     userDept.departmentName ?? "",
        code:     userDept.departmentCode ?? "",
        headName: userDept.headName ?? userDept.userName ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM, order: nextOrder });
    }
    setDialogOpen(true);
  }

  function openEdit(d: Doc<"bodDivisions">) {
    setEditing(d);
    setAddMode("manual"); // edit selalu manual
    setForm({
      name:     d.name,
      type:     d.type as "jasa" | "manufaktur",
      code:     d.code     ?? "",
      headName: d.headName ?? "",
      isActive: d.isActive,
      order:    String(d.order),
    });
    setDialogOpen(true);
  }

  // Saat mode berubah (di dalam dialog baru), reset/refill form
  function switchMode(mode: AddMode) {
    setAddMode(mode);
    const nextOrder = form.order;
    if (mode === "auto" && userDept) {
      setForm({
        ...EMPTY_FORM,
        order:    nextOrder,
        name:     userDept.departmentName ?? "",
        code:     userDept.departmentCode ?? "",
        headName: userDept.headName ?? userDept.userName ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM, order: nextOrder });
    }
  }

  async function handleSubmit() {
    try {
      await upsert({
        id: editing?._id as Id<"bodDivisions"> | undefined,
        ...form,
        order: Number(form.order),
      });
      toast.success(editing ? "Departemen diperbarui" : "Departemen ditambahkan");
      setDialogOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.";
      toast.error(msg);
    }
  }

  async function handleDelete(id: Id<"bodDivisions">) {
    try {
      await remove({ id });
      toast.success("Departemen dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  }

  const userDeptName = userDept?.departmentName ?? null;
  const hasOrgDept   = !!userDeptName;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Manajemen Departemen
              </CardTitle>
              <CardDescription>
                Kelola {divisions?.length ?? 0} departemen. Tambah otomatis dari profil akun atau input manual.
              </CardDescription>
            </div>
            {/* Tombol tambah — dua pilihan */}
            <div className="flex items-center gap-2">
              {hasOrgDept && (
                <Button size="sm" variant="secondary" onClick={() => openNew("auto")} className="cursor-pointer gap-1.5">
                  <Wand2 className="size-3.5" />
                  Otomatis
                </Button>
              )}
              <Button size="sm" onClick={() => openNew("manual")} className="cursor-pointer gap-1.5">
                <PenLine className="size-3.5" />
                Manual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info akun aktif */}
          {userDept && userDept.departmentName && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2.5">
              <UserCheck className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">{userDept.userName}</span>
                {userDept.userJobTitle && <> · {userDept.userJobTitle}</>}
                {" · Departemen: "}
                <span className="font-semibold">{userDept.departmentName}</span>
                {userDept.isHeadOfDept && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                    <Sparkles className="size-2.5" /> Kepala Departemen
                  </span>
                )}
              </div>
            </div>
          )}

          {divisions === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : divisions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Building2 /></EmptyMedia>
                <EmptyTitle>Belum ada departemen</EmptyTitle>
                <EmptyDescription>
                  Tambah departemen menggunakan tombol <strong>Otomatis</strong> (dari profil akun) atau <strong>Manual</strong> (isi sendiri).
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex items-center gap-2">
                  {hasOrgDept && (
                    <Button size="sm" variant="secondary" onClick={() => openNew("auto")} className="cursor-pointer">
                      <Wand2 className="size-4" /> Otomatis
                    </Button>
                  )}
                  <Button size="sm" onClick={() => openNew("manual")} className="cursor-pointer">
                    <PenLine className="size-4" /> Manual
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {divisions.map((d) => (
                <div
                  key={d._id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border p-3 bg-card hover:bg-muted/30 transition-colors",
                    d.name === userDeptName && "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      {d.name === userDeptName && (
                        <Badge className="text-[9px] h-4 px-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0 shrink-0">
                          Dept. Anda
                        </Badge>
                      )}
                      {!d.isActive && <Badge variant="secondary" className="text-[10px] shrink-0">Nonaktif</Badge>}
                    </div>
                    {d.code && <p className="text-[11px] text-muted-foreground font-mono">{d.code}</p>}
                    {d.headName && <p className="text-[11px] text-muted-foreground truncate">Kepala: {d.headName}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="size-7 cursor-pointer" onClick={() => openEdit(d)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7 cursor-pointer text-muted-foreground hover:text-rose-600">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus departemen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Data KPI terkait departemen ini tetap tersimpan, namun departemen tidak akan muncul di daftar.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(d._id)} className="bg-rose-600 hover:bg-rose-700">
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog Tambah / Edit ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Departemen" : "Tambah Departemen Baru"}</DialogTitle>
            {!editing && (
              <DialogDescription>
                {addMode === "auto"
                  ? "Data diisi otomatis dari profil akun Anda."
                  : "Isi data departemen secara manual."}
              </DialogDescription>
            )}
          </DialogHeader>



          <div className="space-y-3">
            {/* Info akun (mode auto) */}
            {!editing && addMode === "auto" && userDept && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                <UserCheck className="size-3.5 shrink-0" />
                <span>
                  <strong>{userDept.userName}</strong>
                  {userDept.userJobTitle && <> · {userDept.userJobTitle}</>}
                  {" · "}<strong>{userDept.departmentName}</strong>
                  {userDept.isHeadOfDept && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 font-semibold">
                      <Sparkles className="size-2.5" /> Kepala Dept.
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <Label>Nama Departemen</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Departemen Keuangan"
                readOnly={!editing && addMode === "auto"}
                className={!editing && addMode === "auto" ? "bg-muted cursor-not-allowed" : ""}
              />
              {!editing && addMode === "auto" && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <UserCheck className="size-3" /> Diambil otomatis dari profil
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Kode Departemen</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. DEPT-01"
                />
              </div>
              <div className="space-y-1">
                <Label>Urutan</Label>
                <Input
                  type="number" min={1}
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Nama Kepala Departemen</Label>
              <Input
                value={form.headName}
                onChange={(e) => setForm((f) => ({ ...f, headName: e.target.value }))}
                placeholder="Nama kepala departemen"
              />
              {!editing && addMode === "auto" && userDept?.isHeadOfDept && (
                <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <Sparkles className="size-3" /> Anda terdeteksi sebagai kepala departemen ini
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.isActive ? "active" : "inactive"}
                onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "active" }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()} className="cursor-pointer">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
