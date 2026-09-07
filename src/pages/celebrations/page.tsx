import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Award, Cake, PartyPopper, UserRoundCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BirthdayCard from "./_components/BirthdayCard.tsx";
import AnniversaryCard from "./_components/AnniversaryCard.tsx";
import EmployeeProfileDialog from "@/pages/directory/_components/EmployeeProfileDialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function CelebrationsPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const birthdays = useQuery(api.celebrations.listUpcomingBirthdays, {});
  const anniversaries = useQuery(api.celebrations.listUpcomingAnniversaries, {});
  const today = useQuery(api.celebrations.todayCelebrations, {});

  const [profileId, setProfileId] = useState<Id<"users"> | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const openProfile = (id: Id<"users">) => {
    setProfileId(id);
    setProfileOpen(true);
  };

  const needsProfileSetup =
    currentUser !== undefined &&
    currentUser !== null &&
    !currentUser.birthday &&
    !currentUser.startDate;

  const todayTotal =
    (today?.birthdays?.length ?? 0) + (today?.anniversaries?.length ?? 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Ulang Tahun & Anniversary
        </h1>
        <p className="text-sm text-muted-foreground">
          Rayakan momen spesial rekan kerja bersama-sama.
        </p>
      </div>

      {/* Today hero */}
      {today === undefined ? (
        <Skeleton className="h-40 w-full" />
      ) : todayTotal > 0 ? (
        <Card className="overflow-hidden border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-amber-500/5 to-purple-500/10">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-background">
                <PartyPopper className="size-6 text-pink-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Perayaan Hari Ini</h2>
                <p className="text-sm text-muted-foreground">
                  Yuk, ucapkan selamat kepada mereka!
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(today?.birthdays ?? []).map((b) => (
                <BirthdayCard
                  key={`bday-today-${b.userId}`}
                  item={b}
                  onClick={() => openProfile(b.userId)}
                />
              ))}
              {(today?.anniversaries ?? []).map((a) => (
                <AnniversaryCard
                  key={`ann-today-${a.userId}`}
                  item={a}
                  onClick={() => openProfile(a.userId)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Profile prompt */}
      {needsProfileSetup ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <UserRoundCog className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Lengkapi profil Anda
                </p>
                <p className="text-xs text-muted-foreground">
                  Tambahkan tanggal ulang tahun dan tanggal mulai kerja agar rekan kerja dapat merayakan bersama Anda.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/directory")}>
              Edit Profil
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Upcoming tabs */}
      <Tabs defaultValue="birthdays" className="space-y-4">
        <TabsList>
          <TabsTrigger value="birthdays" className="gap-2">
            <Cake className="size-4" />
            Ulang Tahun
            {birthdays && birthdays.length > 0 ? (
              <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
                {birthdays.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="anniversaries" className="gap-2">
            <Award className="size-4" />
            Anniversary
            {anniversaries && anniversaries.length > 0 ? (
              <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
                {anniversaries.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="birthdays" className="space-y-2">
          {birthdays === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : birthdays.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Cake />
                </EmptyMedia>
                <EmptyTitle>Belum ada ulang tahun 60 hari ke depan</EmptyTitle>
                <EmptyDescription>
                  Pastikan rekan kerja melengkapi tanggal ulang tahun di profilnya.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/directory")}
                >
                  Buka Direktori
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            birthdays.map((b) => (
              <BirthdayCard
                key={b.userId}
                item={b}
                onClick={() => openProfile(b.userId)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="anniversaries" className="space-y-2">
          {anniversaries === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : anniversaries.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Award />
                </EmptyMedia>
                <EmptyTitle>
                  Belum ada anniversary 60 hari ke depan
                </EmptyTitle>
                <EmptyDescription>
                  Pastikan rekan kerja melengkapi tanggal mulai bekerja di profilnya.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/directory")}
                >
                  Buka Direktori
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            anniversaries.map((a) => (
              <AnniversaryCard
                key={a.userId}
                item={a}
                onClick={() => openProfile(a.userId)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <EmployeeProfileDialog
        userId={profileId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
}
