import { useState } from "react";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { isAdminRole } from "@/convex/roles.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { FolderLock, FileStack, Shield } from "lucide-react";
import UploadPersonalDocDialog from "./_components/UploadPersonalDocDialog.tsx";
import PersonalDocCard from "./_components/PersonalDocCard.tsx";
import PersonalDocStats from "./_components/PersonalDocStats.tsx";
import EmployeesDocsOverview from "./_components/EmployeesDocsOverview.tsx";
import { EMPLOYEE_DOC_CATEGORIES } from "./_lib/utils.ts";

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function MyDocumentsContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const [category, setCategory] = useState<string>("all");
  const [viewingUserId, setViewingUserId] = useState<Id<"users"> | null>(null);

  if (currentUser === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (currentUser === null) return null;

  const isAdmin = isAdminRole(currentUser.role);
  const targetUserId: Id<"users"> = viewingUserId ?? currentUser._id;
  const isViewingSelf = targetUserId === currentUser._id;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FolderLock className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dokumen Saya</h1>
            <p className="text-sm text-muted-foreground">
              Arsip dokumen pribadi karyawan: kontrak, identitas, sertifikat,
              slip gaji, dan lainnya.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="size-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">Dokumen pribadi dan aman</p>
            <p className="text-muted-foreground">
              Hanya Anda dan admin HR yang dapat melihat dokumen di halaman ini.
              Rekan kerja lain tidak memiliki akses.
            </p>
          </div>
        </CardContent>
      </Card>

      <div
        className={`grid gap-6 ${isAdmin ? "lg:grid-cols-[320px_1fr]" : ""}`}
      >
        {isAdmin ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Semua Karyawan
            </h2>
            <EmployeesDocsOverview
              onSelectEmployee={(uid) => {
                setViewingUserId(uid === currentUser._id ? null : uid);
                setCategory("all");
              }}
              selectedId={targetUserId}
            />
          </div>
        ) : null}

        <div className="space-y-6">
          {isAdmin && !isViewingSelf ? (
            <ViewingEmployeeHeader
              userId={targetUserId}
              onBack={() => setViewingUserId(null)}
            />
          ) : null}

          <DocumentsSection
            userId={targetUserId}
            category={category}
            onCategoryChange={setCategory}
            showOwner={isAdmin && !isViewingSelf}
            viewingName={isViewingSelf ? undefined : "karyawan ini"}
          />
        </div>
      </div>
    </div>
  );
}

function ViewingEmployeeHeader({
  userId,
  onBack,
}: {
  userId: Id<"users">;
  onBack: () => void;
}) {
  const user = useQuery(api.users.getEmployeeById, { userId });

  if (user === undefined) {
    return <Skeleton className="h-16 w-full" />;
  }
  if (user === null) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">
                {user.name ?? "Tanpa nama"}
              </p>
              <Badge variant="secondary" className="text-[10px]">
                <Shield className="size-3" />
                Akses admin
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {user.department ?? user.email ?? "-"}
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          Kembali ke dokumen saya
        </button>
      </CardContent>
    </Card>
  );
}

function DocumentsSection({
  userId,
  category,
  onCategoryChange,
  showOwner,
  viewingName,
}: {
  userId: Id<"users">;
  category: string;
  onCategoryChange: (c: string) => void;
  showOwner: boolean;
  viewingName?: string;
}) {
  const stats = useQuery(api.employeeDocuments.getStats, { userId });
  const documents = useQuery(api.employeeDocuments.listForUser, {
    userId,
    category,
  });

  const isLoading = documents === undefined || stats === undefined;

  return (
    <div className="space-y-4">
      <PersonalDocStats stats={stats} isLoading={isLoading} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {Object.entries(EMPLOYEE_DOC_CATEGORIES).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <UploadPersonalDocDialog userId={userId} />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileStack />
            </EmptyMedia>
            <EmptyTitle>
              {category !== "all"
                ? "Tidak ada dokumen di kategori ini"
                : "Belum ada dokumen"}
            </EmptyTitle>
            <EmptyDescription>
              {category !== "all"
                ? "Pilih kategori lain atau tambah dokumen baru."
                : viewingName
                  ? `${viewingName} belum mengunggah dokumen apa pun.`
                  : "Unggah dokumen pertama untuk mulai mengarsipkan."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <UploadPersonalDocDialog userId={userId} />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {documents.map((doc) => (
            <PersonalDocCard
              key={doc._id}
              document={doc}
              showOwner={showOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyDocumentsPage() {
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
          Silakan masuk untuk melihat dokumen Anda.
        </div>
      </Unauthenticated>
      <Authenticated>
        <MyDocumentsContent />
      </Authenticated>
    </>
  );
}
