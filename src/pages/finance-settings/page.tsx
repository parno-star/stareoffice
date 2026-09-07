import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { canManageFinance } from "@/convex/roles.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Wallet, ShieldAlert, ListChecks, Crown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import ApprovalChainSettings from "@/pages/admin/_components/ApprovalChainSettings.tsx";
import PositionLevelSettings from "@/pages/admin/_components/PositionLevelSettings.tsx";
import { useSuperAdminAccess } from "@/hooks/use-super-admin-access.ts";
import SuperAdminBanner from "@/components/super-admin-banner.tsx";

function FinanceSettingsContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const normalAccess = currentUser !== undefined ? canManageFinance(currentUser?.role) : undefined;
  const { hasAccess, bypassedViaRole, isLoading } = useSuperAdminAccess(normalAccess);

  if (isLoading || currentUser === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyTitle>Akses dibatasi</EmptyTitle>
            <EmptyDescription>
              Hanya admin dan pengelola keuangan yang dapat mengakses pengaturan
              ini. Hubungi admin perusahaan jika Anda memerlukan izin.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      {bypassedViaRole && (
        <SuperAdminBanner
          pageName="Pengaturan Keuangan"
          requiredRole="Admin / Finance Manager"
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
          <Wallet className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pengaturan Keuangan
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi alur dan jenjang persetujuan pengajuan keuangan.
          </p>
        </div>
      </div>

      <Tabs defaultValue="persetujuan" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="persetujuan" className="gap-1.5 text-base sm:text-sm sm:gap-2">
            <ListChecks className="size-3.5 hidden sm:block sm:size-4" />
            Persetujuan
          </TabsTrigger>
          <TabsTrigger value="jenjang" className="gap-1.5 text-base sm:text-sm sm:gap-2">
            <Crown className="size-3.5 hidden sm:block sm:size-4" />
            Jenjang Kewenangan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persetujuan" className="space-y-6">
          <ApprovalChainSettings />
        </TabsContent>

        <TabsContent value="jenjang" className="space-y-6">
          <PositionLevelSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FinanceSettingsPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk melihat pengaturan keuangan.
        </div>
      </Unauthenticated>
      <Authenticated>
        <FinanceSettingsContent />
      </Authenticated>
    </>
  );
}
