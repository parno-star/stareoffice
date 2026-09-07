import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Settings,
  ShieldAlert,
  Home,
  LayoutDashboard,
} from "lucide-react";
import HomePageSettings from "./_components/HomePageSettings.tsx";
import DashboardSettings from "./_components/DashboardSettings.tsx";

function AdminDashboardContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const hasAccess = isAdminRole(currentUser?.role);

  if (currentUser === undefined) {
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
              Hanya admin yang dapat mengakses halaman ini. Hubungi admin
              perusahaan jika Anda memerlukan izin.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">
            Kelola tampilan dashboard dan halaman beranda.
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="gap-1.5 text-base sm:text-sm sm:gap-2">
            <LayoutDashboard className="size-3.5 hidden sm:block sm:size-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="beranda" className="gap-1.5 text-base sm:text-sm sm:gap-2">
            <Home className="size-3.5 hidden sm:block sm:size-4" />
            Beranda
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Settings */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardSettings />
        </TabsContent>

        {/* Pengaturan Beranda */}
        <TabsContent value="beranda" className="space-y-6">
          <HomePageSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
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
          Silakan masuk untuk melihat pengaturan halaman.
        </div>
      </Unauthenticated>
      <Authenticated>
        <AdminDashboardContent />
      </Authenticated>
    </>
  );
}
