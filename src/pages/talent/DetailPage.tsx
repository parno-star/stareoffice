import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  ArrowLeft,
  Play,
  Users as UsersIcon,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  Scale,
  History,
  Filter,
  Sparkles,
  Trash2,
  Lock,
  Plus,
} from "lucide-react";
import NineBoxGrid from "./_components/NineBoxGrid.tsx";
import PlacementList from "./_components/PlacementList.tsx";
import PlacementDialog from "./_components/PlacementDialog.tsx";
import IdpPanel from "./_components/IdpPanel.tsx";
import SuccessionPanel from "./_components/SuccessionPanel.tsx";
import AnalyticsPanel from "./_components/AnalyticsPanel.tsx";
import {
  BOX_META,
  CYCLE_STATUS,
  PLACEMENT_STATUS,
  formatDate,
  getBoxMeta,
  getInitials,
  type BoxCode,
} from "./_lib/talent-utils.ts";
import { cn } from "@/lib/utils.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { isAdminRole } from "@/convex/roles.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

function DetailInner({ cycleId }: { cycleId: Id<"talentCycles"> }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const me = useQuery(api.users.getCurrentUser, {});
  const cycleInfo = useQuery(api.talent.getCycle, { cycleId });
  const [filter, setFilter] = useState<
    "all" | "mine" | "pending" | "submitted" | "finalized"
  >("all");
  const placements = useQuery(api.talent.listPlacements, { cycleId, filter });
  const [selectedId, setSelectedId] = useState<Id<"talentPlacements"> | null>(
    null,
  );
  const [selectedCode, setSelectedCode] = useState<BoxCode | null>(null);
  const [dialogMode, setDialogMode] = useState<"manager" | "calibrate" | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const startCycle = useMutation(api.talent.startCycle);
  const setCycleStatus = useMutation(api.talent.setCycleStatus);
  const deleteCycle = useMutation(api.talent.deleteCycle);
  const finalizePlacement = useMutation(api.talent.finalizePlacement);

  const selected = useQuery(
    api.talent.getPlacement,
    selectedId ? { placementId: selectedId } : "skip",
  );

  const isAdmin = isAdminRole(me?.role);

  if (cycleInfo === undefined || me === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (cycleInfo === null) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/talent")}>
          <ArrowLeft /> Kembali
        </Button>
        <p className="mt-4 text-center text-muted-foreground">
          Siklus tidak ditemukan.
        </p>
      </div>
    );
  }

  const { cycle, committee, canManage } = cycleInfo;
  const statusMeta = CYCLE_STATUS[cycle.status];
  // Filter grid by selected code for highlighting
  const gridPlacements = placements ?? [];
  const filteredByCode = selectedCode
    ? gridPlacements.filter((p) => p.placement.boxCode === selectedCode)
    : gridPlacements;

  async function handleStart() {
    try {
      const res = await startCycle({ cycleId });
      toast.success(`Siklus dimulai (${res.created} karyawan ditambahkan)`);
    } catch (error) {
      const msg =
        error instanceof ConvexError
          ? (error.data as { message?: string })?.message ?? "Gagal memulai"
          : "Gagal memulai";
      toast.error(msg);
    }
  }

  async function handleSetStatus(status: string) {
    try {
      await setCycleStatus({ cycleId, status });
      toast.success("Status siklus diperbarui");
    } catch {
      toast.error("Gagal memperbarui status");
    }
  }

  async function handleDeleteCycle() {
    try {
      await deleteCycle({ cycleId });
      toast.success("Siklus dihapus");
      navigate("/talent");
    } catch {
      toast.error("Gagal menghapus");
    }
  }

  async function handleFinalize() {
    if (!selectedId) return;
    try {
      await finalizePlacement({ placementId: selectedId });
      toast.success("Placement difinalisasi");
    } catch (error) {
      const msg =
        error instanceof ConvexError
          ? (error.data as { message?: string })?.message ?? "Gagal"
          : "Gagal";
      toast.error(msg);
    }
  }

  function openPlacement(id: string) {
    setSelectedId(id as Id<"talentPlacements">);
  }

  function openEdit(mode: "manager" | "calibrate") {
    if (!selectedId) return;
    setDialogMode(mode);
    setDialogOpen(true);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/talent")}
          className="mb-2"
        >
          <ArrowLeft className="size-4" /> Kembali
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {cycle.name}
              </h1>
              {statusMeta ? (
                <Badge
                  className={cn("rounded-full border-0", statusMeta.tone)}
                >
                  {statusMeta.label}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {cycle.periodLabel} · {formatDate(cycle.startDate)} –{" "}
              {formatDate(cycle.endDate)}
              {cycle.calibrationDate
                ? ` · Kalibrasi: ${formatDate(cycle.calibrationDate)}`
                : ""}
            </p>
            {cycle.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {cycle.description}
              </p>
            ) : null}
          </div>
          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {cycle.status === "draft" ? (
                <Button onClick={handleStart}>
                  <Play className="size-4" /> Mulai Siklus
                </Button>
              ) : null}
              {cycle.status === "active" ? (
                <Button
                  variant="secondary"
                  onClick={() => handleSetStatus("calibration")}
                >
                  <Scale className="size-4" /> Mulai Kalibrasi
                </Button>
              ) : null}
              {cycle.status === "calibration" ? (
                <Button
                  variant="secondary"
                  onClick={() => handleSetStatus("active")}
                >
                  Kembali ke Input
                </Button>
              ) : null}
              {(cycle.status === "active" || cycle.status === "calibration") && isAdmin ? (
                <Button
                  variant="secondary"
                  onClick={() => handleSetStatus("finalized")}
                >
                  <CheckCircle2 className="size-4" /> Tutup Kalibrasi
                </Button>
              ) : null}
              {cycle.status === "finalized" && isAdmin ? (
                <Button
                  variant="secondary"
                  onClick={() => handleSetStatus("closed")}
                >
                  <Lock className="size-4" /> Arsip
                </Button>
              ) : null}
              {isAdmin ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus siklus?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Semua placement, IDP, dan rencana aksi akan dihapus.
                        Tindakan tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCycle}>
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          ) : null}
        </div>
        {/* Committee */}
        {committee.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Komite:
            </span>
            {committee.map((c) => (
              <span
                key={c._id}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                <Avatar className="size-4">
                  <AvatarImage src={c.avatarUrl} alt={c.name} />
                  <AvatarFallback className="text-[8px]">
                    {getInitials(c.name)}
                  </AvatarFallback>
                </Avatar>
                {c.name}
              </span>
            ))}
          </div>
        ) : null}
        {cycle.instructions ? (
          <div className="mt-3 rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm">
            <strong className="text-primary">Panduan:</strong>{" "}
            {cycle.instructions}
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid" className="gap-2">
            <LayoutGrid className="size-4" /> Nine Box
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <UsersIcon className="size-4" /> Daftar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Sparkles className="size-4" /> Analitik
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-2" disabled={!selectedId}>
            <ClipboardList className="size-4" /> Detail
          </TabsTrigger>
        </TabsList>

        {/* GRID */}
        <TabsContent value="grid" className="space-y-4">
          {placements === undefined ? (
            <Skeleton className="h-[500px] w-full" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Matriks Nine Box</CardTitle>
                <CardDescription>
                  Klik kotak untuk memfilter karyawan, atau klik avatar untuk
                  membuka detail.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NineBoxGrid
                  placements={placements}
                  onSelectPlacement={openPlacement}
                  selectedCode={selectedCode}
                  onSelectCode={setSelectedCode}
                />
              </CardContent>
            </Card>
          )}
          {selectedCode ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Karyawan di{" "}
                  <Badge className={cn("border-0", BOX_META[selectedCode].chip)}>
                    {BOX_META[selectedCode].label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlacementList
                  rows={filteredByCode}
                  onOpen={openPlacement}
                />
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* LIST */}
        <TabsContent value="list" className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select
              value={filter}
              onValueChange={(v) =>
                setFilter(
                  v as "all" | "mine" | "pending" | "submitted" | "finalized",
                )
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="mine">Tim Saya</SelectItem>
                <SelectItem value="pending">Belum Dinilai</SelectItem>
                <SelectItem value="submitted">Menunggu Kalibrasi</SelectItem>
                <SelectItem value="finalized">Sudah Final</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {placements?.length ?? 0} karyawan
            </span>
          </div>
          {placements === undefined ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <PlacementList rows={placements} onOpen={openPlacement} />
          )}
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics">
          <AnalyticsPanel cycleId={cycleId} />
        </TabsContent>

        {/* DETAIL */}
        <TabsContent value="detail">
          {selected === undefined ? (
            <Skeleton className="h-96 w-full" />
          ) : selected === null ? (
            <p className="text-center text-muted-foreground">
              Pilih karyawan dari Nine Box untuk melihat detail.
            </p>
          ) : (
            <DetailContent
              selected={selected}
              openEdit={openEdit}
              onFinalize={handleFinalize}
              authUserId={authUser?.profile.sub}
            />
          )}
        </TabsContent>
      </Tabs>

      <PlacementDialog
        placementId={selectedId}
        placement={selected?.placement ?? null}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

type DetailContentData = NonNullable<
  ReturnType<typeof useQuery<typeof api.talent.getPlacement>>
>;

function DetailContent({
  selected,
  openEdit,
  onFinalize,
  authUserId,
}: {
  selected: DetailContentData;
  openEdit: (mode: "manager" | "calibrate") => void;
  onFinalize: () => void;
  authUserId: string | undefined;
}) {
  void authUserId;
  const { placement, user, manager, idp, idpItems, history, canEditBox, canCalibrate, canFinalize } = selected;
  const boxMeta = getBoxMeta(placement.boxCode);
  const statusMeta = PLACEMENT_STATUS[placement.status];
  const prevMeta = getBoxMeta(placement.previousBoxCode);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left: summary + actions */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarImage src={user?.avatarUrl} alt={placement.userName} />
                <AvatarFallback>
                  {getInitials(placement.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold">{placement.userName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {placement.userJobTitle ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {placement.userDepartment ?? "-"}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {statusMeta ? (
                  <Badge className={cn("border-0", statusMeta.tone)}>
                    {statusMeta.label}
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Segmen</span>
                {boxMeta ? (
                  <Badge className={cn("border-0", boxMeta.chip)}>
                    {boxMeta.label}
                  </Badge>
                ) : (
                  <span className="text-xs">Belum dinilai</span>
                )}
              </div>
              {prevMeta ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sebelumnya</span>
                  <span className="text-xs">{prevMeta.label}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Manajer</span>
                <span className="text-xs truncate">{manager?.name ?? "-"}</span>
              </div>
              {placement.kpiScore !== undefined ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Skor KPI</span>
                  <span className="text-xs">
                    {placement.kpiScore.toFixed(2)} / 3
                  </span>
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {canEditBox ? (
                <Button size="sm" onClick={() => openEdit("manager")}>
                  {placement.performance === undefined ? "Nilai" : "Edit Penilaian"}
                </Button>
              ) : null}
              {canCalibrate ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEdit("calibrate")}
                >
                  <Scale className="size-4" /> Kalibrasi
                </Button>
              ) : null}
              {canFinalize ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onFinalize}
                >
                  <CheckCircle2 className="size-4" /> Finalisasi
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {placement.strengths || placement.developmentAreas ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catatan Manajer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {placement.strengths ? (
                <div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Kekuatan
                  </div>
                  <p className="mt-0.5 text-muted-foreground">
                    {placement.strengths}
                  </p>
                </div>
              ) : null}
              {placement.developmentAreas ? (
                <div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Area Pengembangan
                  </div>
                  <p className="mt-0.5 text-muted-foreground">
                    {placement.developmentAreas}
                  </p>
                </div>
              ) : null}
              {placement.managerNotes ? (
                <div>
                  <div className="text-xs font-semibold">Catatan</div>
                  <p className="mt-0.5 text-muted-foreground">
                    {placement.managerNotes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {placement.committeeNotes ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catatan Komite</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {placement.committeeNotes}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Movement history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" /> Riwayat Pergerakan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada riwayat penempatan.
              </p>
            ) : (
              history.map((h) => {
                const m = getBoxMeta(h.boxCode);
                return (
                  <div
                    key={h._id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {h._id === placement._id ? "Siklus saat ini" : "Siklus lalu"}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {formatDate(h.finalizedAt ?? h.submittedAt)}
                      </div>
                    </div>
                    {m ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px]",
                          m.chip,
                        )}
                      >
                        {m.shortLabel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Belum dinilai</span>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle: IDP */}
      <div className="space-y-4">
        <IdpPanel
          placementId={placement._id}
          idp={idp}
          items={idpItems}
          readOnly={!canEditBox && !canCalibrate}
        />
      </div>

      {/* Right: Succession */}
      <div className="space-y-4">
        <SuccessionPanel
          incumbentId={placement.userId}
          incumbentName={placement.userName}
          canManage={canEditBox || canCalibrate}
        />
      </div>
    </div>
  );
}

// Placeholder to reference lucide icons retained for UX (prevents lint removal
// when extending later features like add placement button).
function _IconsRef() {
  return <Plus className="hidden" />;
}
void _IconsRef;

export default function TalentDetailPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  if (!cycleId) return null;
  return (
    <>
      <AuthLoading>
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center gap-4 p-10">
          <Lock className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Masuk untuk mengakses halaman ini.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <DetailInner cycleId={cycleId as Id<"talentCycles">} />
      </Authenticated>
    </>
  );
}

// Ref to prevent ChevronRight unused-import removal for future use.
const _chevron = ChevronRight;
void _chevron;
