import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { DateField } from "@/components/ui/date-field.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Plus, Pencil, Loader2 } from "lucide-react";
import {
  EMPLOYMENT_TYPES,
  LEVELS,
  JOB_STATUSES,
  JOB_STATUS_CONFIG,
} from "../_lib/recruitment-utils.ts";

type Props =
  | { mode: "create" }
  | {
      mode: "edit";
      job: {
        _id: Id<"recruitmentJobs">;
        title: string;
        department: string;
        location: string;
        employmentType: string;
        level: string;
        description: string;
        responsibilities: string;
        requirements: string;
        salaryMin?: number;
        salaryMax?: number;
        openingDate: string;
        closingDate?: string;
        headcount: number;
        status: string;
        hiringManagerId?: Id<"users">;
        recruiterId?: Id<"users">;
        internalNote?: string;
      };
    };

export default function JobFormDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.job : null;

  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [employmentType, setEmploymentType] = useState(
    initial?.employmentType ?? "fulltime",
  );
  const [level, setLevel] = useState(initial?.level ?? "mid");
  const [status, setStatus] = useState(initial?.status ?? "open");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [responsibilities, setResponsibilities] = useState(
    initial?.responsibilities ?? "",
  );
  const [requirements, setRequirements] = useState(
    initial?.requirements ?? "",
  );
  const [openingDate, setOpeningDate] = useState(
    initial?.openingDate ?? today,
  );
  const [closingDate, setClosingDate] = useState(initial?.closingDate ?? "");
  const [headcount, setHeadcount] = useState(String(initial?.headcount ?? 1));
  const [salaryMin, setSalaryMin] = useState(
    initial?.salaryMin ? String(initial.salaryMin) : "",
  );
  const [salaryMax, setSalaryMax] = useState(
    initial?.salaryMax ? String(initial.salaryMax) : "",
  );
  const [hiringManagerId, setHiringManagerId] = useState<string>(
    initial?.hiringManagerId ?? "none",
  );
  const [recruiterId, setRecruiterId] = useState<string>(
    initial?.recruiterId ?? "none",
  );
  const [internalNote, setInternalNote] = useState(initial?.internalNote ?? "");
  const [submitting, setSubmitting] = useState(false);

  const employees = useQuery(api.users.listEmployees, open ? {} : "skip");
  const createJob = useMutation(api.recruitment.jobs.create);
  const updateJob = useMutation(api.recruitment.jobs.update);

  const resetForm = () => {
    if (!isEdit) {
      setTitle("");
      setDepartment("");
      setLocation("");
      setEmploymentType("fulltime");
      setLevel("mid");
      setStatus("open");
      setDescription("");
      setResponsibilities("");
      setRequirements("");
      setOpeningDate(today);
      setClosingDate("");
      setHeadcount("1");
      setSalaryMin("");
      setSalaryMax("");
      setHiringManagerId("none");
      setRecruiterId("none");
      setInternalNote("");
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const base = {
        title,
        department,
        location,
        employmentType,
        level,
        description,
        responsibilities,
        requirements,
        openingDate,
        closingDate: closingDate || undefined,
        headcount: Number(headcount) || 1,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        hiringManagerId:
          hiringManagerId !== "none"
            ? (hiringManagerId as Id<"users">)
            : undefined,
        recruiterId:
          recruiterId !== "none"
            ? (recruiterId as Id<"users">)
            : undefined,
        internalNote: internalNote || undefined,
      };
      if (isEdit) {
        await updateJob({ id: props.job._id, ...base });
        toast.success("Lowongan diperbarui");
      } else {
        await createJob({ ...base, status });
        toast.success("Lowongan dibuat");
        resetForm();
      }
      setOpen(false);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string };
        toast.error(data.message ?? "Gagal menyimpan lowongan");
      } else {
        toast.error("Gagal menyimpan lowongan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="sm" variant="ghost" className="cursor-pointer">
            <Pencil className="size-4" />
            Edit
          </Button>
        ) : (
          <Button className="cursor-pointer">
            <Plus className="size-4" />
            Lowongan Baru
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Lowongan" : "Buat Lowongan Baru"}
          </DialogTitle>
          <DialogDescription>
            Informasi ini terlihat oleh tim rekrutmen dan hiring manager.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Judul posisi</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Senior Frontend Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Departemen</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jakarta / Remote"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isEdit ? (
              <div className="space-y-2">
                <Label>Status awal</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {JOB_STATUS_CONFIG[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Jumlah posisi</Label>
              <Input
                type="number"
                min={1}
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal buka</Label>
              <DateField
                value={openingDate}
                onChange={(v) => setOpeningDate(v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal tutup (opsional)</Label>
              <DateField
                value={closingDate}
                onChange={(v) => setClosingDate(v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Gaji minimum (IDR)</Label>
              <Input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="Contoh: 12000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Gaji maksimum (IDR)</Label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="Contoh: 20000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Hiring manager</Label>
              <Select
                value={hiringManagerId}
                onValueChange={setHiringManagerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak diset</SelectItem>
                  {(employees ?? []).map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name ?? u.email ?? "Tanpa nama"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recruiter</Label>
              <Select value={recruiterId} onValueChange={setRecruiterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Saya</SelectItem>
                  {(employees ?? []).map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name ?? u.email ?? "Tanpa nama"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ringkas ceritakan posisi ini."
            />
          </div>
          <div className="space-y-2">
            <Label>Tanggung jawab (gunakan baris baru)</Label>
            <Textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={3}
              placeholder={"- Mengembangkan fitur baru\n- Mereview kode tim"}
            />
          </div>
          <div className="space-y-2">
            <Label>Kualifikasi</Label>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              placeholder={"- 3+ tahun pengalaman React\n- TypeScript"}
            />
          </div>
          <div className="space-y-2">
            <Label>Catatan internal (opsional)</Label>
            <Textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={2}
              placeholder="Hanya dilihat oleh tim rekrutmen"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {isEdit ? "Simpan Perubahan" : "Buat Lowongan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
