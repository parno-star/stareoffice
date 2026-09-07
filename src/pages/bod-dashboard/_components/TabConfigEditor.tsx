/**
 * TabConfigEditor
 * ---------------
 * Generic inline editor for BoD tab labels & titles.
 * Shows a floating "Edit Konten" toolbar when editMode=true.
 * All changes are staged locally and saved to Convex on "Simpan".
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { BodTabConfigData } from "@/convex/bodExtended.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Pencil, RotateCcw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

// ---- Types ------------------------------------------------------------------

export type KpiFieldDef = {
  key: string;
  defaultLabel: string;
  defaultSub?: string;
};

export type SectionFieldDef = {
  key: string;
  defaultTitle: string;
};

type Props = {
  tabKey: string;
  defaultTabTitle: string;
  kpiFields: KpiFieldDef[];
  sectionFields?: SectionFieldDef[];
  /** Ikon tombol trigger. Default: Pencil */
  buttonIcon?: React.ElementType;
  /** Label tombol trigger. Default: "Edit Konten Tab" */
  buttonLabel?: string;
  /** Called when edit mode toggles — parent can use to show edit outlines */
  onEditModeChange?: (editing: boolean) => void;
};

// ---- Helper -----------------------------------------------------------------

function useTabConfig(tabKey: string) {
  const raw = useQuery(api.bodExtended.getTabConfig, { tabKey });
  return raw ?? ({} as BodTabConfigData);
}

// ---- Main component ---------------------------------------------------------

export default function TabConfigEditor({
  tabKey,
  defaultTabTitle,
  kpiFields,
  sectionFields = [],
  buttonIcon: ButtonIcon = Pencil,
  buttonLabel = "Edit Konten Tab",
  onEditModeChange,
}: Props) {
  const config = useTabConfig(tabKey);
  const save = useMutation(api.bodExtended.saveTabConfig);

  const [open, setOpen] = useState(false);

  // Local draft state — initialised from config when dialog opens
  const [draftTabTitle, setDraftTabTitle] = useState("");
  const [draftKpiLabels, setDraftKpiLabels] = useState<Record<string, string>>({});
  const [draftKpiSubs, setDraftKpiSubs] = useState<Record<string, string>>({});
  const [draftSectionTitles, setDraftSectionTitles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // When dialog opens, seed draft from latest config
  useEffect(() => {
    if (open) {
      setDraftTabTitle(config.tabTitle ?? "");
      setDraftKpiLabels(config.kpiLabels ?? {});
      setDraftKpiSubs(config.kpiSubs ?? {});
      setDraftSectionTitles(config.sectionTitles ?? {});
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleReset() {
    setDraftTabTitle("");
    setDraftKpiLabels({});
    setDraftKpiSubs({});
    setDraftSectionTitles({});
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: BodTabConfigData = {
        tabTitle: draftTabTitle || undefined,
        kpiLabels: Object.keys(draftKpiLabels).length ? draftKpiLabels : undefined,
        kpiSubs: Object.keys(draftKpiSubs).length ? draftKpiSubs : undefined,
        sectionTitles: Object.keys(draftSectionTitles).length ? draftSectionTitles : undefined,
      };
      await save({ tabKey, config: JSON.stringify(payload) });
      toast.success("Konfigurasi tab disimpan");
      setOpen(false);
      onEditModeChange?.(false);
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Floating edit button */}
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer gap-1.5 h-8 text-xs"
        onClick={() => { setOpen(true); onEditModeChange?.(true); }}
      >
        <ButtonIcon className="size-3.5" />
        {buttonLabel}
      </Button>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onEditModeChange?.(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-amber-500" />
              Edit Konten &amp; Label — Tab {defaultTabTitle}
            </DialogTitle>
            <DialogDescription>
              Ubah judul tab, label kartu KPI, sub-label, dan judul seksi. Kosongkan untuk kembali ke default.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Tab title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Judul Tab</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={draftTabTitle}
                  onChange={(e) => setDraftTabTitle(e.target.value)}
                  placeholder={defaultTabTitle}
                  className="flex-1"
                />
                {draftTabTitle && (
                  <Button size="icon" variant="ghost" className="size-8 cursor-pointer shrink-0" onClick={() => setDraftTabTitle("")}>
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Default: <span className="font-mono">{defaultTabTitle}</span></p>
            </div>

            {/* KPI card labels */}
            {kpiFields.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Label Kartu KPI ({kpiFields.length} kartu)
                  </Label>
                  <div className="space-y-4">
                    {kpiFields.map((f) => (
                      <div key={f.key} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                        <p className="text-xs font-medium text-foreground/70">
                          Kartu: <span className="font-mono text-foreground">{f.defaultLabel}</span>
                        </p>
                        <div className="space-y-1.5">
                          <Label className="text-[11px]">Label Utama</Label>
                          <Input
                            value={draftKpiLabels[f.key] ?? ""}
                            onChange={(e) => setDraftKpiLabels((prev) => {
                              const next = { ...prev };
                              if (e.target.value) next[f.key] = e.target.value;
                              else delete next[f.key];
                              return next;
                            })}
                            placeholder={f.defaultLabel}
                            className="h-8 text-sm"
                          />
                        </div>
                        {f.defaultSub !== undefined && (
                          <div className="space-y-1.5">
                            <Label className="text-[11px]">Sub-label (teks kecil)</Label>
                            <Input
                              value={draftKpiSubs[f.key] ?? ""}
                              onChange={(e) => setDraftKpiSubs((prev) => {
                                const next = { ...prev };
                                if (e.target.value) next[f.key] = e.target.value;
                                else delete next[f.key];
                                return next;
                              })}
                              placeholder={f.defaultSub || "(dinamis dari data)"}
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Section titles */}
            {sectionFields.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Judul Seksi &amp; Chart
                  </Label>
                  <div className="space-y-3">
                    {sectionFields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">
                          Default: <span className="font-mono">{f.defaultTitle}</span>
                        </Label>
                        <Input
                          value={draftSectionTitles[f.key] ?? ""}
                          onChange={(e) => setDraftSectionTitles((prev) => {
                            const next = { ...prev };
                            if (e.target.value) next[f.key] = e.target.value;
                            else delete next[f.key];
                            return next;
                          })}
                          placeholder={f.defaultTitle}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="cursor-pointer gap-1.5 text-muted-foreground">
              <RotateCcw className="size-3.5" />
              Reset ke Default
            </Button>
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)} className="cursor-pointer">Batal</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer gap-1.5">
                <Save className="size-3.5" />
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---- Hook for consuming config in tab components ---------------------------

export function useResolvedConfig(tabKey: string) {
  const raw = useQuery(api.bodExtended.getTabConfig, { tabKey });
  const config = raw ?? ({} as BodTabConfigData);

  return {
    tabTitle: (key: string, fallback: string) => config.tabTitle && key === "tabTitle" ? config.tabTitle : fallback,
    label: (key: string, fallback: string) => config.kpiLabels?.[key] ?? fallback,
    sub: (key: string, fallback: string) => config.kpiSubs?.[key] ?? fallback,
    section: (key: string, fallback: string) => config.sectionTitles?.[key] ?? fallback,
    config,
  };
}
