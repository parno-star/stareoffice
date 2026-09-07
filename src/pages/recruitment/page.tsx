import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  BriefcaseBusiness,
  Users,
  Calendar,
  LayoutDashboard,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import JobsTab from "./_components/JobsTab.tsx";
import CandidatesTab from "./_components/CandidatesTab.tsx";
import JobDetailPanel from "./_components/JobDetailPanel.tsx";
import InterviewsTab from "./_components/InterviewsTab.tsx";
import ApplicationDetailPanel from "./_components/ApplicationDetailPanel.tsx";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 truncate text-xl font-bold">{value}</p>
            {hint ? (
              <p className="text-xs text-muted-foreground truncate">{hint}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecruitmentInner() {
  const statsQuery = useQuery(api.recruitment.jobs.getStats, {});
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Id<"recruitmentJobs"> | null>(
    null,
  );
  const [selectedCandidate, setSelectedCandidate] = useState<
    Id<"candidates"> | null
  >(null);

  const tab = searchParams.get("tab") ?? "jobs";
  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
    setSelectedJob(null);
  };

  if (statsQuery === undefined) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const stats = statsQuery ?? {
    canManage: true,
    openCount: 0,
    draftCount: 0,
    totalCandidates: 0,
    activeApplications: 0,
    interviewsThisWeek: 0,
    hiredThisMonth: 0,
  };

  if (!stats.canManage) {
    return (
      <div className="space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rekrutmen & ATS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola rekrutmen eksternal: lowongan, kandidat, dan pipeline hiring.
          </p>
        </div>
        <Card className="border-amber-300 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="size-5 text-amber-600" />
            <div>
              <p className="font-semibold">Akses dibatasi</p>
              <p className="text-sm text-muted-foreground">
                Modul ini hanya dapat diakses oleh admin, bendahara, atau atasan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekrutmen & ATS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola rekrutmen eksternal: lowongan, kandidat, dan pipeline hiring.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BriefcaseBusiness}
          label="Lowongan Terbuka"
          value={String(stats.openCount)}
          hint={`${stats.draftCount} draft`}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Users}
          label="Kandidat Aktif"
          value={String(stats.totalCandidates)}
          hint="dalam database ATS"
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Activity}
          label="Lamaran Aktif"
          value={String(stats.activeApplications)}
          hint="dalam pipeline"
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          icon={Calendar}
          label="Interview Minggu Ini"
          value={String(stats.interviewsThisWeek)}
          hint={`${stats.hiredThisMonth} hire bulan ini`}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="jobs" className="cursor-pointer">
            <LayoutDashboard className="size-4" />
            Lowongan
          </TabsTrigger>
          <TabsTrigger value="candidates" className="cursor-pointer">
            <Users className="size-4" />
            Kandidat
          </TabsTrigger>
          <TabsTrigger value="interviews" className="cursor-pointer">
            <Calendar className="size-4" />
            Interview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="jobs" className="space-y-4">
          {selectedJob ? (
            <JobDetailPanel
              jobId={selectedJob}
              onBack={() => setSelectedJob(null)}
            />
          ) : (
            <JobsTab onOpenJob={(id) => setSelectedJob(id)} />
          )}
        </TabsContent>
        <TabsContent value="candidates" className="space-y-4">
          <CandidatesTab
            onOpenCandidate={(id) => setSelectedCandidate(id)}
          />
        </TabsContent>
        <TabsContent value="interviews" className="space-y-4">
          <InterviewsTab />
        </TabsContent>
      </Tabs>

      {/* Candidate detail uses its own dialog - just show last apps */}
      {selectedCandidate ? (
        <CandidateQuickPanel
          candidateId={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      ) : null}

      {/* Hide unused imports */}
      <ApplicationDetailPanel applicationId={null} onClose={() => {}} />
    </div>
  );
}

function CandidateQuickPanel({
  candidateId,
  onClose,
}: {
  candidateId: Id<"candidates">;
  onClose: () => void;
}) {
  const candidate = useQuery(api.recruitment.candidates.getById, {
    id: candidateId,
  });
  const apps = useQuery(api.recruitment.applications.listForCandidate, {
    candidateId,
  });
  const [openApp, setOpenApp] = useState<Id<"candidateApplications"> | null>(
    null,
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border bg-background p-4 shadow-xl md:inset-y-8 md:right-8 md:left-auto md:w-[480px] md:rounded-2xl">
        {candidate === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : candidate === null ? (
          <p className="p-6 text-center text-muted-foreground">
            Kandidat tidak ditemukan.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">
                  {candidate.firstName} {candidate.lastName ?? ""}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {candidate.currentTitle}
                  {candidate.currentCompany
                    ? ` · ${candidate.currentCompany}`
                    : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {candidate.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-md p-1 hover:bg-muted"
              >
                ✕
              </button>
            </div>
            {candidate.summary ? (
              <p className="whitespace-pre-wrap text-sm">{candidate.summary}</p>
            ) : null}
            {candidate.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {candidate.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border bg-muted/50 px-2 py-0.5 text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Riwayat Lamaran
              </p>
              {apps === undefined ? (
                <Skeleton className="h-16 w-full" />
              ) : apps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada lamaran.
                </p>
              ) : (
                <div className="space-y-2">
                  {apps.map((a) => (
                    <button
                      key={a._id}
                      onClick={() => setOpenApp(a._id)}
                      className="block w-full cursor-pointer rounded-md border p-2 text-left text-sm hover:border-primary/40"
                    >
                      <p className="font-medium">{a.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {a.stage} · {a.jobDepartment}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ApplicationDetailPanel
        applicationId={openApp}
        onClose={() => setOpenApp(null)}
      />
    </>
  );
}

export default function RecruitmentPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk mengakses modul rekrutmen.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <RecruitmentInner />
      </Authenticated>
    </>
  );
}
