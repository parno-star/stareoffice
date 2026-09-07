import { useState } from "react";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Compass,
  Layers,
  Search,
  Users,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import CareerPathFormDialog from "../career-path/_components/CareerPathFormDialog.tsx";
import PathCard from "../career-path/_components/PathCard.tsx";
import CareerStatCard from "../career-path/_components/CareerStatCard.tsx";
import { TRACK_OPTIONS } from "../career-path/_lib/career-utils.ts";

function ManagePaths() {
  const [search, setSearch] = useState("");
  const [track, setTrack] = useState("all");
  const [department, setDepartment] = useState("all");
  const [debouncedSearch] = useDebounce(search, 250);
  const departments = useQuery(api.users.listDepartments, {});
  const paths = useQuery(api.careerPath.listPaths, {
    search: debouncedSearch || undefined,
    track,
    department,
    includeUnpublished: true,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari jenjang karier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={track} onValueChange={setTrack}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Track</SelectItem>
              {TRACK_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Departemen</SelectItem>
              {(departments ?? []).map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {paths === undefined ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Compass />
            </EmptyMedia>
            <EmptyTitle>Belum ada jenjang karier</EmptyTitle>
            <EmptyDescription>
              Buat jenjang karier pertama untuk mulai memetakan pengembangan
              karyawan.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CareerPathFormDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {paths.map((p) => (
            <PathCard key={p._id} path={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CareerPlanningInner() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useCurrentRole();
  const stats = useQuery(api.careerPath.getStats, {});

  if (isLoading || stats === undefined) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyTitle>Akses terbatas</EmptyTitle>
            <EmptyDescription>
              Halaman perencanaan karier hanya untuk administrator/HR. Untuk
              melihat jenjang karier Anda, buka menu "Jenjang Karier Saya".
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <button
              className="text-sm font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
              onClick={() => navigate("/career-path")}
            >
              Buka Jenjang Karier Saya
            </button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Perencanaan Karier
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-balance">
            Rancang dan kelola jalur karier organisasi: buat jenjang, atur level
            dan persyaratannya, tugaskan karyawan, dan pantau promosi. Terintegrasi
            dengan <span className="font-medium">training</span> dan{" "}
            <span className="font-medium">KPI</span>.
          </p>
        </div>
        <CareerPathFormDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CareerStatCard
          icon={Compass}
          label="Total Jenjang"
          value={String(stats.totalPaths)}
          hint={`${stats.publishedPaths} dipublikasi`}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <CareerStatCard
          icon={Layers}
          label="Jenjang Aktif"
          value={String(stats.publishedPaths)}
          hint="tersedia untuk karyawan"
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <CareerStatCard
          icon={Users}
          label="Total Penugasan"
          value={String(stats.totalAssignments)}
          hint="karyawan aktif di jenjang"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <CareerStatCard
          icon={Sparkles}
          label="Jenjang Saya"
          value={String(stats.myAssignments)}
          hint="aktif diikuti"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <ManagePaths />
    </div>
  );
}

export default function CareerPlanningPage() {
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
            Silakan masuk untuk mengelola jenjang karier.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <CareerPlanningInner />
      </Authenticated>
    </>
  );
}
