import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  ShieldAlert,
  Settings,
  Plus,
  Package,
  Sparkles,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import PlanCard from "./_components/PlanCard.tsx";
import PlanFormDialog from "./_components/PlanFormDialog.tsx";
import { generatePlansFeaturePdf } from "./_lib/generate-plans-pdf.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

function MembershipSettingsContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const plans = useQuery(api.membership.list, {});
  const seedDefaults = useMutation(api.membership.seedDefaults);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Doc<"membershipPlans"> | null>(null);
  const [seeding, setSeeding] = useState(false);

  if (currentUser === undefined || plans === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdminRole(currentUser?.role)) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyTitle>Akses dibatasi</EmptyTitle>
            <EmptyDescription>
              Hanya Administrator atau Super Admin yang dapat mengakses
              pengaturan paket keanggotaan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDefaults({});
      toast.success("Paket default berhasil dibuat!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat paket default";
      toast.error(message);
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadPdf = () => {
    try {
      generatePlansFeaturePdf(plans);
      toast.success("PDF daftar fitur berhasil diunduh.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat PDF.";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pengaturan Paket Keanggotaan
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola paket langganan, harga, batas fitur, dan modul yang tersedia.
            </p>
          </div>
        </div>
        <Button
          className="cursor-pointer gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="size-4" />
          Tambah Paket
        </Button>
      </div>

      {plans.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>Belum ada paket keanggotaan</EmptyTitle>
            <EmptyDescription>
              Buat paket baru secara manual atau gunakan template default
              untuk memulai dengan cepat.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                className="cursor-pointer gap-2"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-4" />
                Buat Manual
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="cursor-pointer gap-2"
                onClick={handleSeed}
                disabled={seeding}
              >
                <Sparkles className="size-4" />
                {seeding ? "Membuat..." : "Gunakan Template Default"}
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                onEdit={() => setEditingPlan(plan)}
              />
            ))}
          </div>

          {/* Marketing: download all features as PDF */}
          <div className="flex justify-center border-t pt-6">
            <Button
              size="sm"
              variant="secondary"
              className="cursor-pointer gap-2"
              onClick={handleDownloadPdf}
            >
              <FileDown className="size-4" />
              Unduh Semua Fitur (PDF)
            </Button>
          </div>
        </>
      )}

      {/* Create dialog */}
      <PlanFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        plan={null}
        existingCount={plans.length}
      />

      {/* Edit dialog */}
      {editingPlan && (
        <PlanFormDialog
          open={!!editingPlan}
          onOpenChange={(open) => {
            if (!open) setEditingPlan(null);
          }}
          plan={editingPlan}
          existingCount={plans.length}
        />
      )}
    </div>
  );
}

export default function MembershipSettingsPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk mengakses pengaturan.
        </div>
      </Unauthenticated>
      <Authenticated>
        <MembershipSettingsContent />
      </Authenticated>
    </>
  );
}
