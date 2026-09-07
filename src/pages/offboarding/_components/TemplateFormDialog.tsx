import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Plus } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { OWNER_LABELS, TASK_CATEGORY_CONFIG } from "../_lib/offboarding-utils.ts";

type Props = {
  trigger?: ReactNode;
  template?: Doc<"offboardingChecklistTemplates">;
};

export default function TemplateFormDialog({ trigger, template }: Props) {
  const isEdit = !!template;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [category, setCategory] = useState<string>(
    template?.category ?? "asset_return",
  );
  const [ownerRole, setOwnerRole] = useState<string>(
    template?.ownerRole ?? "hr",
  );
  const [dueOffsetDays, setDueOffsetDays] = useState<number>(
    template?.dueOffsetDays ?? 0,
  );
  const [submitting, setSubmitting] = useState(false);

  const create = useMutation(api.offboarding.createTemplate);
  const update = useMutation(api.offboarding.updateTemplate);

  useEffect(() => {
    if (open && template) {
      setTitle(template.title);
      setDescription(template.description ?? "");
      setCategory(template.category);
      setOwnerRole(template.ownerRole);
      setDueOffsetDays(template.dueOffsetDays);
    } else if (open && !template) {
      setTitle("");
      setDescription("");
      setCategory("asset_return");
      setOwnerRole("hr");
      setDueOffsetDays(0);
    }
  }, [open, template]);

  const handleSubmit = async () => {
    const t = title.trim();
    if (t.length === 0) {
      toast.error("Judul wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && template) {
        await update({
          id: template._id as Id<"offboardingChecklistTemplates">,
          title: t,
          description: description.trim() || undefined,
          category,
          ownerRole,
          dueOffsetDays,
        });
        toast.success("Template diperbarui");
      } else {
        await create({
          title: t,
          description: description.trim() || undefined,
          category,
          ownerRole,
          dueOffsetDays,
        });
        toast.success("Template ditambahkan");
      }
      setOpen(false);
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string };
        toast.error(d.message ?? "Gagal menyimpan");
      } else {
        toast.error("Gagal menyimpan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1 cursor-pointer">
            <Plus className="size-4" />
            Template Baru
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template Tugas" : "Template Tugas Baru"}
          </DialogTitle>
          <DialogDescription>
            Tugas akan otomatis dibuat untuk setiap pengajuan resign yang
            disetujui.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-title">Judul</Label>
            <Input
              id="tpl-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kembalikan laptop & aksesoris"
              disabled={submitting}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="tpl-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail tambahan..."
              disabled={submitting}
              maxLength={500}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TASK_CATEGORY_CONFIG).map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Penanggung Jawab</Label>
              <Select
                value={ownerRole}
                onValueChange={setOwnerRole}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OWNER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-offset">
              Deadline (hari relatif ke hari terakhir)
            </Label>
            <Input
              id="tpl-offset"
              type="number"
              value={dueOffsetDays}
              onChange={(e) => setDueOffsetDays(Number(e.target.value))}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Negatif = sebelum hari terakhir, 0 = pada hari terakhir, positif =
              setelah.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || title.trim().length === 0}
            className="cursor-pointer"
          >
            {submitting ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
