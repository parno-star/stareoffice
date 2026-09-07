import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  URGENCY_OPTIONS,
  IMPACT_OPTIONS,
  STATUS_OPTIONS,
} from "../_lib/constants.ts";
import type { StrategicIssueRow } from "../page.tsx";

const NONE = "__none__";

const schema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(160),
  description: z.string().max(2000).optional(),
  ownerId: z.string().min(1, "Pilih PIC"),
  department: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["low", "medium", "high"]),
  status: z.enum(["needs_decision", "in_progress", "monitoring", "resolved"]),
  dueDate: z.string().optional(),
  linkedObjectiveId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// Convert a YYYY-MM-DD date input value to an ISO 8601 UTC instant (end of day)
// and back, since the backend stores dueDate as an ISO string.
function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
function dateInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  // Interpret the picked calendar date at UTC midnight.
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export default function IssueFormDialog({
  open,
  onOpenChange,
  issue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: StrategicIssueRow | null;
}) {
  const [saving, setSaving] = useState(false);
  const options = useQuery(api.strategicIssues.getFormOptions, open ? {} : "skip");
  const createIssue = useMutation(api.strategicIssues.createIssue);
  const updateIssue = useMutation(api.strategicIssues.updateIssue);

  const isEdit = issue !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      ownerId: "",
      department: NONE,
      urgency: "high",
      impact: "high",
      status: "needs_decision",
      dueDate: "",
      linkedObjectiveId: NONE,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (issue) {
      form.reset({
        title: issue.title,
        description: issue.description ?? "",
        ownerId: issue.ownerId,
        department: issue.department ?? NONE,
        urgency: issue.urgency as FormValues["urgency"],
        impact: issue.impact as FormValues["impact"],
        status: issue.status as FormValues["status"],
        dueDate: isoToDateInput(issue.dueDate),
        linkedObjectiveId: issue.linkedObjectiveId ?? NONE,
      });
    } else {
      const defaultOwner = (options?.owners && options.owners.length > 0) ? options.owners[0]._id : "";
      form.reset({
        title: "",
        description: "",
        ownerId: defaultOwner,
        department: NONE,
        urgency: "high",
        impact: "high",
        status: "needs_decision",
        dueDate: "",
        linkedObjectiveId: NONE,
      });
    }
  }, [open, issue, form, options]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        ownerId: values.ownerId as Id<"users">,
        department:
          values.department && values.department !== NONE
            ? values.department
            : undefined,
        urgency: values.urgency,
        impact: values.impact,
        status: values.status,
        dueDate: dateInputToIso(values.dueDate ?? ""),
        linkedObjectiveId:
          values.linkedObjectiveId && values.linkedObjectiveId !== NONE
            ? (values.linkedObjectiveId as Id<"objectives">)
            : undefined,
      };
      if (isEdit && issue) {
        await updateIssue({ issueId: issue._id, ...payload });
        toast.success("Isu strategis diperbarui");
      } else {
        await createIssue(payload);
        toast.success("Isu strategis ditambahkan");
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menyimpan isu");
      } else {
        toast.error("Gagal menyimpan isu");
      }
    } finally {
      setSaving(false);
    }
  };

  const owners = (options?.owners && options.owners.length > 0)
    ? options.owners
    : [{ _id: "1", name: "Developer Admin (Super Admin)", department: "Manajemen" }];
  const departments = (options?.departments && options.departments.length > 0)
    ? options.departments
    : ["Manajemen", "Operasional", "Teknologi Informasi", "Keuangan", "Sumber Daya Manusia", "Umum", "Pemasaran"];
  const objectives = options?.objectives ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Isu Strategis" : "Tambah Isu Strategis"}
          </DialogTitle>
          <DialogDescription>
            Catat isu atau prioritas mendesak yang perlu perhatian Direksi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Isu</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Risiko keterlambatan proyek migrasi"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Jelaskan konteks isu, dampak, dan keputusan yang dibutuhkan..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIC (Penanggung Jawab)</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih PIC" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {owners.map((o) => (
                        <SelectItem key={o._id} value={o._id}>
                          {o.name}
                          {o.department ? ` · ${o.department}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Terkait (opsional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Tidak ada</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgensi</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {URGENCY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dampak</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {IMPACT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Keputusan</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenggat (opsional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="linkedObjectiveId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tautkan Objektif (opsional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih objektif" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Tidak ada</SelectItem>
                      {objectives.map((o) => (
                        <SelectItem key={o._id} value={o._id}>
                          {o.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Hubungkan isu ini dengan objektif OKR terkait bila ada.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Menyimpan..."
                  : isEdit
                    ? "Simpan Perubahan"
                    : "Tambah Isu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
