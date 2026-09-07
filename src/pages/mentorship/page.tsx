import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  HeartHandshake,
  Users,
  Inbox,
  CalendarCheck,
  Plus,
  Users2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import MentorDirectory from "./_components/MentorDirectory.tsx";
import MyMentorshipsTab from "./_components/MyMentorshipsTab.tsx";
import MentorshipRequestsTab from "./_components/MentorshipRequestsTab.tsx";
import PeerGroupsTab from "./_components/PeerGroupsTab.tsx";
import MentorProfileDialog from "./_components/MentorProfileDialog.tsx";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
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
            <p className="mt-0.5 text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MentorshipPageInner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const myProfile = useQuery(api.training.mentors.getMyMentorProfile, {});
  const stats = useQuery(api.training.mentors.getMentorshipStats, {});
  const pendingRequests = useQuery(
    api.training.mentorships.listMyMentorships,
    {
      role: "mentor",
      status: "pending",
    },
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "mentors";
  const visibleTabs = new Set([
    "mentors",
    "my",
    "requests",
    "groups",
  ]);
  const tab = visibleTabs.has(rawTab) ? rawTab : "mentors";
  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === "mentors") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    setSearchParams(params, { replace: true });
  };
  const requestsCount = pendingRequests?.length ?? 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mentorship &amp; Peer Learning
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Temukan mentor, bagikan keahlian, dan belajar bareng rekan kerja.
          </p>
        </div>
        <MentorProfileDialog
          trigger={
            <Button size="sm" className="cursor-pointer gap-1">
              <Plus className="size-4" />
              {myProfile ? "Edit profil mentor" : "Jadi mentor"}
            </Button>
          }
          initialValues={
            myProfile
              ? {
                  headline: myProfile.headline,
                  bio: myProfile.bio,
                  expertise: myProfile.expertise,
                  categories: myProfile.categories,
                  preferredMentee: myProfile.preferredMentee,
                  preferredChannel: myProfile.preferredChannel,
                  capacity: myProfile.capacity,
                  availability: myProfile.availability,
                  isAcceptingRequests: myProfile.isAcceptingRequests,
                  isPublished: myProfile.isPublished,
                }
              : undefined
          }
        />
      </div>

      {stats === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={HeartHandshake}
            label="Mentor aktif"
            value={String(stats?.mentorCount ?? 0)}
            accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          />
          <StatCard
            icon={Users}
            label="Mentorship berjalan"
            value={String(stats?.activeMentorships ?? 0)}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={Inbox}
            label="Permintaan menunggu"
            value={String(stats?.totalRequests ?? 0)}
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={CalendarCheck}
            label="Sesi mendatang"
            value={String(stats?.upcomingSessions ?? 0)}
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="no-scrollbar flex h-auto w-full justify-start gap-1 overflow-x-auto whitespace-nowrap lg:flex-wrap">
          <TabsTrigger value="mentors" className="cursor-pointer gap-1">
            <HeartHandshake className="size-3.5" /> Direktori mentor
          </TabsTrigger>
          <TabsTrigger value="my" className="cursor-pointer gap-1">
            <Users className="size-3.5" /> Mentorship saya
          </TabsTrigger>
          <TabsTrigger value="requests" className="cursor-pointer gap-1">
            <Inbox className="size-3.5" /> Permintaan
            {requestsCount > 0 ? (
              <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {requestsCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="groups" className="cursor-pointer gap-1">
            <Users2 className="size-3.5" /> Grup belajar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mentors">
          <MentorDirectory currentUserId={currentUser?._id} />
        </TabsContent>
        <TabsContent value="my">
          <MyMentorshipsTab />
        </TabsContent>
        <TabsContent value="requests">
          <MentorshipRequestsTab />
        </TabsContent>
        <TabsContent value="groups">
          <PeerGroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MentorshipPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk mengakses mentorship.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <MentorshipPageInner />
      </Authenticated>
    </>
  );
}
