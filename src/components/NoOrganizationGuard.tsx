import { useAuth } from "@/hooks/use-auth.ts";
import { useTenant } from "@/hooks/use-tenant.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Building2, LogOut, ArrowRight, ShieldCheck, PlusCircle } from "lucide-react";
import { useState } from "react";
import OnboardingDialog from "@/components/onboarding-dialog.tsx";

/**
 * Shows a screen when the authenticated user has no organization
 * assigned yet (and is not a super_admin). Super admins can always pass.
 *
 * Provides actions to enter as Super Admin / Demo, register a new organization, or logout.
 */
export default function NoOrganizationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isSuperAdmin, organizationId } = useTenant();
  const { removeUser } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Still loading tenant data
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    );
  }

  // Super admins or users with organization can always access the platform
  if (isSuperAdmin || organizationId) {
    return <>{children}</>;
  }

  // Regular user without an organization
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <OnboardingDialog
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-10 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Belum Tergabung Organisasi</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Akun Anda belum terhubung dengan organisasi manapun. Anda dapat langsung masuk menggunakan mode Administrator / Demo atau mendaftarkan organisasi baru.
        </p>

        <div className="space-y-3 pt-2">
          <Button
            className="w-full gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            onClick={() => {
              localStorage.setItem("star_demo_org_bypass", "1");
              window.location.reload();
            }}
          >
            <ShieldCheck className="size-4" />
            Masuk Sebagai Super Admin / Demo
            <ArrowRight className="size-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 cursor-pointer"
            onClick={() => setOnboardingOpen(true)}
          >
            <PlusCircle className="size-4" />
            Daftarkan Organisasi Baru
          </Button>

          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground cursor-pointer"
            onClick={async () => {
              try {
                await removeUser();
              } catch {
                /* ignore */
              }
              window.location.replace("/");
            }}
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </div>
    </div>
  );
}
