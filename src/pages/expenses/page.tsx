import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Card,
  CardContent,
} from "@/components/ui/card.tsx";
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
import { Button } from "@/components/ui/button.tsx";
import { DateField } from "@/components/ui/date-field.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Receipt,
  Clock,
  CheckCircle2,
  BadgeDollarSign,
  AlertCircle,
  Download,
  Wallet,
  Check,
  X,
  Filter,
} from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import CreateExpenseDialog from "./_components/CreateExpenseDialog.tsx";
import CreateCashAdvanceDialog from "./_components/CreateCashAdvanceDialog.tsx";
import ExpenseCard from "./_components/ExpenseCard.tsx";
import CashAdvanceCard from "./_components/CashAdvanceCard.tsx";
import ExpensePoliciesPanel from "./_components/ExpensePoliciesPanel.tsx";
import ExpenseCategoriesPanel from "./_components/ExpenseCategoriesPanel.tsx";
import ExpenseAnalyticsPanel from "./_components/ExpenseAnalyticsPanel.tsx";
import MarkPaidDialog from "./_components/MarkPaidDialog.tsx";
import {
  formatCurrency,
  STATUS_CONFIG,
  ADVANCE_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
  buildCategoryDisplayMap,
  resolveCategoryDisplay,
  getStatusConfig,
  toCsvRow,
  downloadCsv,
  type PaymentMethod,
} from "./_lib/expense-utils.ts";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

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
            <p className="text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 truncate text-xl font-bold">{value}</p>
            {hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MyExpensesTab({
  currentUserId,
}: {
  currentUserId: Id<"users"> | null;
}) {
  const [status, setStatus] = useState("all");
  const expenses = useQuery(api.expenses.listMine, { status });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Riwayat Pengajuan Anda</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {expenses === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !expenses || expenses.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt />
            </EmptyMedia>
            <EmptyTitle>Belum ada pengajuan</EmptyTitle>
            <EmptyDescription>
              Ajukan penggantian biaya pertama Anda untuk mulai melihat
              riwayatnya di sini.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateExpenseDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {expenses.map((e) => (
            <ExpenseCard
              key={e._id}
              expense={e}
              isAdmin={false}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MyCashAdvancesTab({
  currentUserId,
}: {
  currentUserId: Id<"users"> | null;
}) {
  const [status, setStatus] = useState("all");
  const advances = useQuery(api.cashAdvances.listMine, { status });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Uang Muka Saya</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(ADVANCE_STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {advances === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !advances || advances.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>Belum ada uang muka</EmptyTitle>
            <EmptyDescription>
              Ajukan uang muka saat Anda membutuhkan dana talangan sebelum
              pengeluaran dilakukan.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateCashAdvanceDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {advances.map((a) => (
            <CashAdvanceCard
              key={a._id}
              advance={a}
              isAdmin={false}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminExpensesTab({
  currentUserId,
}: {
  currentUserId: Id<"users"> | null;
}) {
  const [status, setStatus] = useState("pending");
  const [category, setCategory] = useState("all");
  const [department, setDepartment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<Set<Id<"expenseReports">>>(
    new Set(),
  );
  const [bulkPayOpen, setBulkPayOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const expenses = useQuery(api.expenses.listAll, {
    status,
    category,
    department,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const departments = useQuery(api.expenses.listDepartments, {});
  const categoryList = useQuery(api.expenseCategories.list, {});
  const categoryMap = useMemo(
    () => buildCategoryDisplayMap(categoryList ?? []),
    [categoryList],
  );
  const bulkReview = useMutation(api.expenses.bulkReview);

  const toggleSelect = (id: Id<"expenseReports">) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedArr = useMemo(() => [...selected], [selected]);
  const selectableIds = useMemo(
    () => (expenses ?? []).map((e) => e._id),
    [expenses],
  );
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIds));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const selectedExpenses = useMemo(
    () => (expenses ?? []).filter((e) => selected.has(e._id)),
    [expenses, selected],
  );

  const hasPendingSelected = selectedExpenses.some(
    (e) => e.status === "pending",
  );
  const hasApprovedSelected = selectedExpenses.some(
    (e) => e.status === "approved",
  );

  const runBulkReview = async (mode: "approved" | "rejected") => {
    if (selected.size === 0) return;
    setBulkSubmitting(true);
    try {
      const { count } = await bulkReview({
        ids: selectedArr,
        status: mode,
      });
      toast.success(
        `${count} pengajuan ${mode === "approved" ? "disetujui" : "ditolak"}`,
      );
      clearSelection();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal memproses");
      } else {
        toast.error("Gagal memproses");
      }
    } finally {
      setBulkSubmitting(false);
    }
  };

  const exportCsv = () => {
    if (!expenses || expenses.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }
    const rows: Array<string> = [];
    rows.push(
      toCsvRow([
        "Tanggal",
        "Karyawan",
        "Departemen",
        "Judul",
        "Kategori",
        "Nominal",
        "Status",
        "Metode Bayar",
        "Referensi",
        "Reviewer",
        "Catatan",
      ]),
    );
    for (const e of expenses) {
      rows.push(
        toCsvRow([
          e.expenseDate,
          e.userName ?? "",
          e.userDepartment ?? "",
          e.title,
          resolveCategoryDisplay(e.category, categoryMap).label,
          e.amount,
          getStatusConfig(e.status).label,
          e.paymentMethod &&
          e.paymentMethod in PAYMENT_METHOD_LABELS
            ? PAYMENT_METHOD_LABELS[e.paymentMethod as PaymentMethod]
            : "",
          e.paymentReference ?? "",
          e.reviewerName ?? "",
          e.reviewNote ?? "",
        ]),
      );
    }
    const filename = `reimbursement-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, rows);
    toast.success(`${expenses.length} baris di-export`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs">
              <Filter className="size-3" /> Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                  <SelectItem key={v} value={v}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {(categoryList ?? []).map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Departemen</Label>
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
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Dari</Label>
            <DateField
              value={startDate}
              onChange={(v) => setStartDate(v)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai</Label>
            <DateField
              value={endDate}
              onChange={(v) => setEndDate(v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Pilih semua"
            />
            <span className="text-muted-foreground">
              {selected.size > 0
                ? `${selected.size} dipilih`
                : `Pilih semua (${selectableIds.length})`}
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 ? (
            <>
              {hasPendingSelected ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => runBulkReview("approved")}
                    disabled={bulkSubmitting}
                    className="gap-1 cursor-pointer"
                  >
                    <Check className="size-4" />
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => runBulkReview("rejected")}
                    disabled={bulkSubmitting}
                    className="gap-1 cursor-pointer"
                  >
                    <X className="size-4" />
                    Tolak
                  </Button>
                </>
              ) : null}
              {hasApprovedSelected ? (
                <Button
                  size="sm"
                  onClick={() => setBulkPayOpen(true)}
                  className="gap-1 cursor-pointer"
                >
                  <BadgeDollarSign className="size-4" />
                  Bayar
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="cursor-pointer"
              >
                Batal Pilih
              </Button>
            </>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={exportCsv}
            className="gap-1 cursor-pointer"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {expenses === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !expenses || expenses.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt />
            </EmptyMedia>
            <EmptyTitle>Tidak ada pengajuan</EmptyTitle>
            <EmptyDescription>
              Tidak ada pengajuan reimbursement dengan filter ini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Menampilkan {expenses.length} pengajuan ·{" "}
            Total {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}
          </p>
          <div className="space-y-3">
            {expenses.map((e) => (
              <ExpenseCard
                key={e._id}
                expense={e}
                isAdmin
                currentUserId={currentUserId}
                selected={selected.has(e._id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        </>
      )}

      <MarkPaidDialog
        open={bulkPayOpen}
        onOpenChange={setBulkPayOpen}
        expenseIds={selectedExpenses
          .filter((e) => e.status === "approved")
          .map((e) => e._id)}
        onSuccess={clearSelection}
      />
    </div>
  );
}

function AdminCashAdvancesTab({
  currentUserId,
}: {
  currentUserId: Id<"users"> | null;
}) {
  const [status, setStatus] = useState("pending");
  const advances = useQuery(api.cashAdvances.listAll, { status });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Semua Uang Muka</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(ADVANCE_STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {advances === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !advances || advances.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>Tidak ada pengajuan uang muka</EmptyTitle>
            <EmptyDescription>
              Tidak ada pengajuan uang muka dengan filter ini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {advances.map((a) => (
            <CashAdvanceCard
              key={a._id}
              advance={a}
              isAdmin
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpensesPageInner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const { role } = useCurrentRole();
  const stats = useQuery(api.expenses.getStats, {});
  const advanceStats = useQuery(api.cashAdvances.getStats, {});

  const canManageFinance =
    role === "super_admin" || role === "admin" || role === "finance_manager" || role === "payroll_officer";

  if (!currentUser || !stats) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const currentUserId = currentUser?._id ?? null;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reimbursement & Pengeluaran
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajukan reimbursement, kelola uang muka, dan pantau analitik
            pengeluaran perusahaan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CreateCashAdvanceDialog />
          <CreateExpenseDialog />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Menunggu Persetujuan"
          value={String(stats?.myPending ?? 0)}
          hint="pengajuan Anda"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Disetujui"
          value={formatCurrency(stats?.myApprovedAmount ?? 0)}
          hint="menunggu pembayaran"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={BadgeDollarSign}
          label="Sudah Dibayar"
          value={formatCurrency(stats?.myPaidAmount ?? 0)}
          hint="total sepanjang waktu"
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        {canManageFinance ? (
          <StatCard
            icon={AlertCircle}
            label="Menunggu Review Admin"
            value={String(stats?.adminPendingCount ?? 0)}
            hint={formatCurrency(stats?.adminPendingAmount ?? 0)}
            accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
        ) : (
          <StatCard
            icon={Wallet}
            label="Uang Muka Aktif"
            value={String(advanceStats?.myActiveCount ?? 0)}
            hint={formatCurrency(advanceStats?.myOutstandingAmount ?? 0)}
            accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
        )}
      </div>

      <Tabs defaultValue="mine" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex w-max flex-nowrap">
            <TabsTrigger value="mine" className="cursor-pointer">
              Pengajuan Saya
            </TabsTrigger>
            <TabsTrigger value="advances" className="cursor-pointer">
              Uang Muka Saya
            </TabsTrigger>
            {canManageFinance ? (
              <>
                <TabsTrigger value="admin" className="cursor-pointer">
                  Semua Pengajuan
                </TabsTrigger>
                <TabsTrigger value="admin-advances" className="cursor-pointer">
                  Semua Uang Muka
                </TabsTrigger>
                <TabsTrigger value="analytics" className="cursor-pointer">
                  Analitik
                </TabsTrigger>
                <TabsTrigger value="categories" className="cursor-pointer">
                  Kategori
                </TabsTrigger>
                <TabsTrigger value="policies" className="cursor-pointer">
                  Kebijakan
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>
        </div>

        <TabsContent value="mine">
          <MyExpensesTab currentUserId={currentUserId} />
        </TabsContent>
        <TabsContent value="advances">
          <MyCashAdvancesTab currentUserId={currentUserId} />
        </TabsContent>
        {canManageFinance ? (
          <>
            <TabsContent value="admin">
              <AdminExpensesTab currentUserId={currentUserId} />
            </TabsContent>
            <TabsContent value="admin-advances">
              <AdminCashAdvancesTab currentUserId={currentUserId} />
            </TabsContent>
            <TabsContent value="analytics">
              <ExpenseAnalyticsPanel />
            </TabsContent>
            <TabsContent value="categories">
              <ExpenseCategoriesPanel />
            </TabsContent>
            <TabsContent value="policies">
              <ExpensePoliciesPanel />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}

// Main page content.

export default function ExpensesPage() {
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
            Silakan masuk untuk mengajukan reimbursement.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <ExpensesPageInner />
      </Authenticated>
    </>
  );
}
