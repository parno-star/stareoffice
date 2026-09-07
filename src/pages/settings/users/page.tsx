import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ShieldAlert, Settings, UsersRound, KeyRound, ClipboardCheck, Mail } from "lucide-react";
import UserRolesTab from "./_components/UserRolesTab.tsx";
import RoleMenusTab from "./_components/RoleMenusTab.tsx";
import ApprovalTab from "./_components/ApprovalTab.tsx";
import InviteTab from "./_components/InviteTab.tsx";

function UserSettingsContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const pendingCount = useQuery(api.roleRequests.countPending, {});
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = ["invite", "approval", "users", "menus"] as const;
  const paramTab = searchParams.get("tab");
  const tab =
    paramTab && VALID_TABS.includes(paramTab as (typeof VALID_TABS)[number])
      ? paramTab
      : "users";
  const setTab = (next: string) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", next);
        return params;
      },
      { replace: true },
    );
  };

  if (currentUser === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
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
              Pengaturan Pengguna dan akses menu. Hubungi Super Admin jika Anda
              memerlukan izin.
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
          <h1 className="text-2xl font-bold tracking-tight">
            Pengaturan Pengguna
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola peran pengguna, persetujuan akun, dan kontrol akses menu.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="invite" className="gap-2">
            <Mail className="size-4" />
            Undangan Pengguna
          </TabsTrigger>
          <TabsTrigger value="approval" className="gap-2">
            <ClipboardCheck className="size-4" />
            Persetujuan Akun
            {pendingCount !== undefined && pendingCount > 0 && (
              <Badge className="ml-1 size-5 items-center justify-center rounded-full p-0 text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UsersRound className="size-4" />
            Pengguna & Peran
          </TabsTrigger>
          <TabsTrigger value="menus" className="gap-2">
            <KeyRound className="size-4" />
            Akses Menu per Peran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invite">
          <InviteTab />
        </TabsContent>

        <TabsContent value="users">
          {currentUser && (
            <UserRolesTab
              currentUserId={currentUser._id}
              currentUserRole={currentUser.role}
            />
          )}
        </TabsContent>

        <TabsContent value="approval">
          <ApprovalTab />
        </TabsContent>

        <TabsContent value="menus">
          {currentUser && (
            <RoleMenusTab currentUserRole={currentUser.role} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function UserSettingsPage() {
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
          Silakan masuk untuk mengakses pengaturan.
        </div>
      </Unauthenticated>
      <Authenticated>
        <UserSettingsContent />
      </Authenticated>
    </>
  );
}
