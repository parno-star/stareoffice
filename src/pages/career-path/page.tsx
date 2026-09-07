import { useState } from "react";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
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
  Target,
  User as UserIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import PathCard from "./_components/PathCard.tsx";
import AssignmentCard from "./_components/AssignmentCard.tsx";
import CareerStatCard from "./_components/CareerStatCard.tsx";
import { TRACK_OPTIONS } from "./_lib/career-utils.ts";

function CatalogTab() {
  const [search, setSearch] = useState("");
  const [track, setTrack] = useState("all");
  const [department, setDepartment] = useState("all");
  const [debouncedSearch] = useDebounce(search, 250);
  const departments = useQuery(api.users.listDepartments, {});
  const paths = useQuery(api.careerPath.listPaths, {
    search: debouncedSearch || undefined,
    track,
    department,
    includeUnpublished: false,
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
              Belum ada jenjang karier yang dipublikasikan. Hubungi HR untuk
              informasi lebih lanjut.
            </EmptyDescription>
          </EmptyHeader>
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

function MyPathsTab() {
  const assignments = useQuery(api.careerPath.listMyAssignments, {});
  if (assignments === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }
  if (assignments.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Target />
          </EmptyMedia>
          <EmptyTitle>Belum ada jenjang</EmptyTitle>
          <EmptyDescription>
            Anda belum ditugaskan ke jenjang karier mana pun. Jelajahi tab
            "Katalog Jenjang" untuk melihat jalur yang tersedia, atau hubungi
            atasan/HR untuk mulai merencanakan karier.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {assignments.map((a) => (
        <AssignmentCard key={a._id} assignment={a} />
      ))}
    </div>
  );
}

function CareerPathInner() {
  const statsQuery = useQuery(api.careerPath.getStats, {});

  if (statsQuery === undefined) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const stats = statsQuery ?? { myAssignments: 0, publishedPaths: 0 };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Jenjang Karier Saya
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-balance">
          Pantau perkembangan karier Anda: lihat level saat ini dan berikutnya,
          pelajari training wajibnya, dan lacak progres yang dihitung otomatis
          dari <span className="font-medium">training</span> dan{" "}
          <span className="font-medium">KPI</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CareerStatCard
          icon={Sparkles}
          label="Jenjang Saya"
          value={String(stats.myAssignments)}
          hint="aktif diikuti"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <CareerStatCard
          icon={Compass}
          label="Jenjang Tersedia"
          value={String(stats.publishedPaths)}
          hint="dapat dijelajahi"
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <CareerStatCard
          icon={TrendingUp}
          label="Total Jalur"
          value={String(stats.publishedPaths)}
          hint="jalur karier aktif"
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </div>

      <Tabs defaultValue="my" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex w-max flex-nowrap">
            <TabsTrigger value="my" className="cursor-pointer">
              <UserIcon className="size-4" />
              Jenjang Saya
            </TabsTrigger>
            <TabsTrigger value="catalog" className="cursor-pointer">
              <Compass className="size-4" />
              Katalog Jenjang
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="my">
          <MyPathsTab />
        </TabsContent>
        <TabsContent value="catalog">
          <CatalogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CareerPathPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk melihat jenjang karier.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <CareerPathInner />
      </Authenticated>
    </>
  );
}
