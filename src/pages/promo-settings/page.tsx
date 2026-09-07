import { useState } from "react";
import { useQuery } from "convex/react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  ShieldAlert,
  Tag,
  Plus,
  ArrowUpCircle,
} from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import PromoCard from "./_components/PromoCard.tsx";
import PromoFormDialog from "./_components/PromoFormDialog.tsx";
import UpgradeRequestsList from "./_components/UpgradeRequestsList.tsx";

function PromoSettingsContent({ embedded = false }: { embedded?: boolean }) {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const promos = useQuery(api.promos.list, {});
  const [showCreate, setShowCreate] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Doc<"promos"> | null>(null);

  if (currentUser === undefined || promos === undefined) {
    return (
      <div
        className={
          embedded
            ? "space-y-6"
            : "mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6"
        }
      >
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
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
            <EmptyMedia variant="icon"><ShieldAlert /></EmptyMedia>
            <EmptyTitle>Akses dibatasi</EmptyTitle>
            <EmptyDescription>
              Hanya Administrator atau Super Admin yang dapat mengakses
              pengaturan promo dan upgrade.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "space-y-6"
          : "mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6"
      }
    >
      {/* Header */}
      {!embedded && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <Tag className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Promo & Upgrade
              </h1>
              <p className="text-sm text-muted-foreground">
                Kelola promo, kode diskon, dan permintaan upgrade organisasi.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="promos" className="w-full">
        <TabsList>
          <TabsTrigger value="promos" className="cursor-pointer gap-2">
            <Tag className="size-4" />
            Promo
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="cursor-pointer gap-2">
            <ArrowUpCircle className="size-4" />
            Permintaan Upgrade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              className="cursor-pointer gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="size-4" />
              Buat Promo Baru
            </Button>
          </div>

          {promos.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Tag /></EmptyMedia>
                <EmptyTitle>Belum ada promo</EmptyTitle>
                <EmptyDescription>
                  Buat kode promo untuk memberikan diskon, tambahan pengguna,
                  atau penyimpanan ekstra kepada organisasi.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  className="cursor-pointer gap-2"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="size-4" />
                  Buat Promo Pertama
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {promos.map((promo) => (
                <PromoCard
                  key={promo._id}
                  promo={promo}
                  onEdit={() => setEditingPromo(promo)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upgrades" className="mt-4">
          <UpgradeRequestsList />
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <PromoFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        promo={null}
      />

      {/* Edit dialog */}
      {editingPromo && (
        <PromoFormDialog
          open={!!editingPromo}
          onOpenChange={(open) => {
            if (!open) setEditingPromo(null);
          }}
          promo={editingPromo}
        />
      )}
    </div>
  );
}

export function PromoSettingsEmbedded() {
  return <PromoSettingsContent embedded />;
}

export default function PromoSettingsPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
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
        <PromoSettingsContent />
      </Authenticated>
    </>
  );
}
