import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { DateField } from "@/components/ui/date-field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { suggestCurrentPeriod, getInitials } from "../_lib/talent-utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { cn } from "@/lib/utils.ts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateCycleDialog({ open, onOpenChange }: Props) {
  const suggestion = suggestCurrentPeriod();
  const [name, setName] = useState(`Talent Review ${suggestion.label}`);
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState(suggestion.key);
  const [periodLabel, setPeriodLabel] = useState(suggestion.label);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [calibrationDate, setCalibrationDate] = useState("");
  const [performanceSource, setPerformanceSource] = useState<
    "manual" | "kpi" | "hybrid"
  >("hybrid");
  const [instructions, setInstructions] = useState("");
  const [committeeIds, setCommitteeIds] = useState<Array<Id<"users">>>([]);
  const [departments, setDepartments] = useState<Array<string>>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allUsers = useQuery(api.users.listEmployees, {}) ?? [];
  const departmentOptions = Array.from(
    new Set(allUsers.map((u) => u.department).filter(Boolean)),
  ).sort() as Array<string>;

  const createCycle = useMutation(api.talent.createCycle);

  const filtered = allUsers
    .filter((u) =>
      search
        ? (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (u.email ?? "").toLowerCase().includes(search.toLowerCase())
        : true,
    )
    .slice(0, 30);

  function toggleMember(id: Id<"users">) {
    setCommitteeIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function toggleDepartment(dept: string) {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((p) => p !== dept) : [...prev, dept],
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Nama siklus wajib diisi");
      return;
    }
    if (committeeIds.length === 0) {
      toast.error("Pilih minimal 1 anggota komite kalibrasi");
      return;
    }
    setSubmitting(true);
    try {
      await createCycle({
        name: name.trim(),
        description: description || undefined,
        period,
        periodLabel,
        startDate,
        endDate,
        calibrationDate: calibrationDate || undefined,
        performanceSource,
        committeeIds,
        departments,
        instructions: instructions || undefined,
      });
      toast.success("Siklus talent review berhasil dibuat");
      onOpenChange(false);
    } catch (error) {
      const msg =
        error instanceof ConvexError
          ? (error.data as { message?: string })?.message ?? "Gagal menyimpan"
          : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Buat Siklus Talent Review</DialogTitle>
          <DialogDescription>
            Siklus menentukan jadwal kalibrasi Nine Box, anggota komite, dan
            cakupan departemen.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="cycle-name">Nama Siklus</Label>
            <Input
              id="cycle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Talent Review Semester 1 2026"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cycle-period">Periode (kode)</Label>
            <Input
              id="cycle-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-H1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cycle-period-label">Label Periode</Label>
            <Input
              id="cycle-period-label"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="Semester 1 2026"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cycle-start">Mulai</Label>
            <DateField
              id="cycle-start"
              value={startDate}
              onChange={(v) => setStartDate(v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cycle-end">Selesai</Label>
            <DateField
              id="cycle-end"
              value={endDate}
              onChange={(v) => setEndDate(v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cycle-calibration">Tanggal Kalibrasi (opsional)</Label>
            <DateField
              id="cycle-calibration"
              value={calibrationDate}
              onChange={(v) => setCalibrationDate(v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sumber Nilai Performa</Label>
            <Select
              value={performanceSource}
              onValueChange={(v) =>
                setPerformanceSource(v as "manual" | "kpi" | "hybrid")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Input manual saat kalibrasi</SelectItem>
                <SelectItem value="kpi">Otomatis dari modul KPI</SelectItem>
                <SelectItem value="hybrid">
                  Hybrid (KPI bila ada, bisa override)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="cycle-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="cycle-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Tujuan siklus, fokus, dll"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="cycle-inst">Instruksi untuk Manajer (opsional)</Label>
            <Textarea
              id="cycle-inst"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Catatan panduan kalibrasi"
            />
          </div>

          {/* Scope departments */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Cakupan Departemen</Label>
            <div className="flex flex-wrap gap-2 rounded-lg border p-3">
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium cursor-pointer",
                  departments.length === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-background",
                )}
                onClick={() => setDepartments([])}
              >
                Semua
              </button>
              {departmentOptions.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium cursor-pointer",
                    departments.includes(d)
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                  onClick={() => toggleDepartment(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Kosongkan untuk mencakup seluruh karyawan.
            </p>
          </div>

          {/* Committee picker */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Komite Kalibrasi</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama karyawan..."
            />
            <ScrollArea className="h-40 rounded-lg border">
              <div className="divide-y">
                {filtered.map((u) => {
                  const selected = committeeIds.includes(u._id);
                  return (
                    <label
                      key={u._id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/60"
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleMember(u._id)}
                      />
                      <Avatar className="size-8">
                        <AvatarImage src={u.avatarUrl} alt={u.name} />
                        <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {u.name ?? "?"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {u.jobTitle ?? "-"}{" "}
                          {u.department ? `• ${u.department}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="flex flex-wrap gap-1">
              {committeeIds.map((id) => {
                const u = allUsers.find((x) => x._id === id);
                if (!u) return null;
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {u.name}
                    <button
                      type="button"
                      className="ml-1 text-xs"
                      onClick={() => toggleMember(id)}
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner /> : null}
            Buat Siklus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
