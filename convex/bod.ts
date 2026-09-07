import { ConvexError, v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";
import { isExecutiveRole } from "./roles";
import { requireTenant } from "./lib/tenant";
import { isCountableEmployee } from "./lib/countableUsers";

// ---------------------------------------------------------------------------
// Board of Director (BoD) executive summary
//
// A single, decision-oriented snapshot for the board. It aggregates data that
// already lives in the app (OKR objectives, workforce, finance requests) and
// rolls each core metric up into a RAG (Red / Amber / Green) status so the
// board can practice "management by exception". Everything is tenant-scoped and
// read-only.
// ---------------------------------------------------------------------------

export type RagStatus = "green" | "amber" | "red" | "neutral";

export type BodKpi = {
  key: string;
  label: string;
  value: string;
  sublabel: string;
  rag: RagStatus;
  // Optional period-over-period delta (percentage points or percent change).
  deltaLabel: string | null;
  deltaDirection: "up" | "down" | "flat" | null;
  // Whether an increase is good (used to color the delta).
  higherIsBetter: boolean;
};

export type BodSummary = {
  hasAccess: boolean;
  periodLabel: string;
  generatedAt: string; // ISO timestamp
  kpis: Array<BodKpi>;
  okrHealth: {
    total: number;
    onTrack: number;
    atRisk: number;
    offTrack: number;
    achieved: number;
    averageProgress: number;
  };
  finance: {
    approvedThisMonth: number;
    approvedLastMonth: number;
    pendingCount: number;
    pendingAmount: number;
  };
  workforce: {
    totalEmployees: number;
    totalDepartments: number;
    newHires90d: number;
  };
};

async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const { userId } = await requireTenant(ctx, { allowSuperAdmin: true });
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  }
  return user;
}

// Current annual OKR period key ("2026"). Objectives use a period string that
// sorts lexically; the board view focuses on the running fiscal year.
function currentYearPeriod(): { period: string; label: string } {
  const year = new Date().getUTCFullYear();
  return { period: String(year), label: `Tahun ${year}` };
}

// UTC month boundaries as ISO strings for period-over-period finance figures.
function monthBoundsUtc(): {
  thisMonthStart: string;
  lastMonthStart: string;
  nextMonthStart: string;
} {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const thisMonthStart = new Date(Date.UTC(y, m, 1)).toISOString();
  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const nextMonthStart = new Date(Date.UTC(y, m + 1, 1)).toISOString();
  return { thisMonthStart, lastMonthStart, nextMonthStart };
}

function ragForRiskShare(atRiskShare: number): RagStatus {
  // Share of company/department objectives that are at risk or off track.
  if (atRiskShare <= 0.1) return "green";
  if (atRiskShare <= 0.3) return "amber";
  return "red";
}

function ragForProgress(progress: number): RagStatus {
  if (progress >= 70) return "green";
  if (progress >= 40) return "amber";
  return "red";
}

function formatShortIdr(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function pctChange(current: number, previous: number): {
  label: string | null;
  direction: "up" | "down" | "flat" | null;
} {
  if (previous <= 0) {
    if (current <= 0) return { label: null, direction: null };
    return { label: "Baru bulan ini", direction: "up" };
  }
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  if (rounded === 0) return { label: "0%", direction: "flat" };
  return {
    label: `${rounded > 0 ? "+" : ""}${rounded}%`,
    direction: rounded > 0 ? "up" : "down",
  };
}

const EMPTY_SUMMARY = (periodLabel: string): BodSummary => ({
  hasAccess: false,
  periodLabel,
  generatedAt: new Date().toISOString(),
  kpis: [],
  okrHealth: {
    total: 0,
    onTrack: 0,
    atRisk: 0,
    offTrack: 0,
    achieved: 0,
    averageProgress: 0,
  },
  finance: {
    approvedThisMonth: 0,
    approvedLastMonth: 0,
    pendingCount: 0,
    pendingAmount: 0,
  },
  workforce: { totalEmployees: 0, totalDepartments: 0, newHires90d: 0 },
});

export const getExecutiveSummary = query({
  args: {},
  handler: async (ctx): Promise<BodSummary> => {
    const { period, label } = currentYearPeriod();
    const user = await getCurrentUser(ctx);

    if (!isExecutiveRole(user.role)) {
      return EMPTY_SUMMARY(label);
    }

    const orgId = user.organizationId ?? null;

    // Scope every read to the caller's organization. Objectives, users, and
    // fund requests all carry an optional organizationId with a by_organization
    // index, so we query the tenant's slice directly.
    const [objectives, users, departments, fundRequests] = await Promise.all([
      orgId
        ? ctx.db
            .query("objectives")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect()
        : Promise.resolve<Array<Doc<"objectives">>>([]),
      orgId
        ? ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect()
            .then((all) => all.filter(isCountableEmployee))
        : Promise.resolve<Array<Doc<"users">>>([]),
      orgId
        ? ctx.db
            .query("departments")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect()
        : Promise.resolve<Array<Doc<"departments">>>([]),
      orgId
        ? ctx.db
            .query("fundRequests")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect()
        : Promise.resolve<Array<Doc<"fundRequests">>>([]),
    ]);

    // --- OKR health (company + department objectives for the running year) ---
    const strategicObjectives = objectives.filter(
      (o) =>
        o.period === period &&
        o.status !== "archived" &&
        (o.scope === "company" || o.scope === "department"),
    );
    let onTrack = 0;
    let atRisk = 0;
    let offTrack = 0;
    let achieved = 0;
    let progressSum = 0;
    for (const o of strategicObjectives) {
      if (o.health === "on_track") onTrack += 1;
      else if (o.health === "at_risk") atRisk += 1;
      else if (o.health === "off_track") offTrack += 1;
      else if (o.health === "achieved") achieved += 1;
      progressSum += o.progress;
    }
    const okrTotal = strategicObjectives.length;
    const averageProgress =
      okrTotal > 0 ? Math.round(progressSum / okrTotal) : 0;
    const riskCount = atRisk + offTrack;
    const riskShare = okrTotal > 0 ? riskCount / okrTotal : 0;

    // --- Workforce ---
    const totalEmployees = users.length;
    const totalDepartments = departments.length;
    const now = Date.now();
    const ninetyAgoIso = new Date(now - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const todayIso = new Date(now).toISOString().slice(0, 10);
    const newHires90d = users.filter(
      (u) => u.startDate && u.startDate >= ninetyAgoIso && u.startDate <= todayIso,
    ).length;

    // --- Finance (approved/disbursed funds this vs last month) ---
    const { thisMonthStart, lastMonthStart, nextMonthStart } = monthBoundsUtc();
    const isApproved = (r: Doc<"fundRequests">) =>
      r.status === "approved" || r.status === "disbursed";
    // Use submittedAt as the reference timestamp; fall back to creation time.
    const refIso = (r: Doc<"fundRequests">) =>
      r.submittedAt ?? new Date(r._creationTime).toISOString();

    let approvedThisMonth = 0;
    let approvedLastMonth = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    for (const r of fundRequests) {
      if (isApproved(r)) {
        const ref = refIso(r);
        if (ref >= thisMonthStart && ref < nextMonthStart) {
          approvedThisMonth += r.amount;
        } else if (ref >= lastMonthStart && ref < thisMonthStart) {
          approvedLastMonth += r.amount;
        }
      }
      if (r.status === "pending" || r.status === "in_review") {
        pendingCount += 1;
        pendingAmount += r.amount;
      }
    }

    // --- Build KPI cards ---
    const financeDelta = pctChange(approvedThisMonth, approvedLastMonth);
    const kpis: Array<BodKpi> = [
      {
        key: "okr_progress",
        label: "Progres OKR Strategis",
        value: `${averageProgress}%`,
        sublabel: `${okrTotal} objektif perusahaan & departemen`,
        rag: okrTotal === 0 ? "neutral" : ragForProgress(averageProgress),
        deltaLabel: null,
        deltaDirection: null,
        higherIsBetter: true,
      },
      {
        key: "okr_risk",
        label: "Objektif Berisiko",
        value: String(riskCount),
        sublabel:
          okrTotal === 0
            ? "Belum ada objektif"
            : `${Math.round(riskShare * 100)}% dari objektif strategis`,
        rag: okrTotal === 0 ? "neutral" : ragForRiskShare(riskShare),
        deltaLabel: null,
        deltaDirection: null,
        higherIsBetter: false,
      },
      {
        key: "headcount",
        label: "Total Karyawan",
        value: totalEmployees.toLocaleString("id-ID"),
        sublabel: `${totalDepartments} departemen aktif`,
        rag: "neutral",
        deltaLabel: newHires90d > 0 ? `+${newHires90d} (90 hari)` : null,
        deltaDirection: newHires90d > 0 ? "up" : null,
        higherIsBetter: true,
      },
      {
        key: "finance_approved",
        label: "Dana Disetujui (Bulan Ini)",
        value: formatShortIdr(approvedThisMonth),
        sublabel: `Bulan lalu ${formatShortIdr(approvedLastMonth)}`,
        rag: "neutral",
        deltaLabel: financeDelta.label,
        deltaDirection: financeDelta.direction,
        higherIsBetter: false,
      },
      {
        key: "finance_pending",
        label: "Pengajuan Dana Menunggu",
        value: String(pendingCount),
        sublabel: `Senilai ${formatShortIdr(pendingAmount)}`,
        rag:
          pendingCount === 0
            ? "green"
            : pendingCount <= 5
              ? "amber"
              : "red",
        deltaLabel: null,
        deltaDirection: null,
        higherIsBetter: false,
      },
      {
        key: "okr_achieved",
        label: "Objektif Tercapai",
        value: String(achieved),
        sublabel:
          okrTotal === 0
            ? "Belum ada objektif"
            : `dari ${okrTotal} objektif strategis`,
        rag: "neutral",
        deltaLabel: null,
        deltaDirection: null,
        higherIsBetter: true,
      },
    ];

    return {
      hasAccess: true,
      periodLabel: label,
      generatedAt: new Date().toISOString(),
      kpis,
      okrHealth: {
        total: okrTotal,
        onTrack,
        atRisk,
        offTrack,
        achieved,
        averageProgress,
      },
      finance: {
        approvedThisMonth,
        approvedLastMonth,
        pendingCount,
        pendingAmount,
      },
      workforce: { totalEmployees, totalDepartments, newHires90d },
    };
  },
});

// ---------------------------------------------------------------------------
// Per-unit (department) KPI monitoring
//
// Rolls each department up into a RAG status derived from the health &
// progress of its department-scoped objectives for the running year, plus
// supporting workforce figures. Departments that deviate from target (amber /
// red) are what the board should focus on.
// ---------------------------------------------------------------------------

export type UnitKpi = {
  departmentId: Id<"departments"> | null;
  name: string;
  color: string;
  headName: string | null;
  employeeCount: number;
  objectiveCount: number;
  averageProgress: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  achieved: number;
  riskCount: number;
  rag: RagStatus;
};

export type UnitKpiGrid = {
  hasAccess: boolean;
  periodLabel: string;
  units: Array<UnitKpi>;
};

// A department's RAG blends how many objectives are off-track/at-risk with the
// overall average progress. Off-track objectives dominate (red); otherwise
// at-risk or low progress raise a warning.
function ragForUnit(
  objectiveCount: number,
  offTrack: number,
  atRisk: number,
  averageProgress: number,
): RagStatus {
  if (objectiveCount === 0) return "neutral";
  if (offTrack > 0 || averageProgress < 40) return "red";
  if (atRisk > 0 || averageProgress < 70) return "amber";
  return "green";
}

// Sort so the units needing attention surface first: red, then amber, then
// green/neutral; within a tier, lower progress first.
const RAG_ORDER: Record<RagStatus, number> = {
  red: 0,
  amber: 1,
  neutral: 2,
  green: 3,
};

export const getUnitKpis = query({
  args: {},
  handler: async (ctx): Promise<UnitKpiGrid> => {
    const { period, label } = currentYearPeriod();
    const user = await getCurrentUser(ctx);

    if (!isExecutiveRole(user.role)) {
      return { hasAccess: false, periodLabel: label, units: [] };
    }

    const orgId = user.organizationId ?? null;
    if (!orgId) {
      return { hasAccess: true, periodLabel: label, units: [] };
    }

    const [departments, objectives, users] = await Promise.all([
      ctx.db
        .query("departments")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("objectives")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect()
        .then((all) => all.filter(isCountableEmployee)),
    ]);

    // Resolve department head names in one pass.
    const headIds = departments
      .map((d) => d.headId)
      .filter((id): id is Id<"users"> => id !== undefined);
    const headDocs = await Promise.all(headIds.map((id) => ctx.db.get(id)));
    const headNameById = new Map<Id<"users">, string>();
    for (const h of headDocs) {
      if (h) headNameById.set(h._id, h.name ?? "Tanpa nama");
    }

    // Count employees per department name.
    const employeesByDept = new Map<string, number>();
    for (const u of users) {
      const dept = u.department;
      if (!dept) continue;
      employeesByDept.set(dept, (employeesByDept.get(dept) ?? 0) + 1);
    }

    // Department-scoped objectives for the running year, grouped by department name.
    const deptObjectives = objectives.filter(
      (o) =>
        o.period === period &&
        o.status !== "archived" &&
        o.scope === "department" &&
        !!o.department,
    );
    const objsByDept = new Map<string, Array<Doc<"objectives">>>();
    for (const o of deptObjectives) {
      const key = o.department as string;
      const arr = objsByDept.get(key) ?? [];
      arr.push(o);
      objsByDept.set(key, arr);
    }

    const units: Array<UnitKpi> = departments.map((d) => {
      const objs = objsByDept.get(d.name) ?? [];
      let onTrack = 0;
      let atRisk = 0;
      let offTrack = 0;
      let achieved = 0;
      let progressSum = 0;
      for (const o of objs) {
        if (o.health === "on_track") onTrack += 1;
        else if (o.health === "at_risk") atRisk += 1;
        else if (o.health === "off_track") offTrack += 1;
        else if (o.health === "achieved") achieved += 1;
        progressSum += o.progress;
      }
      const objectiveCount = objs.length;
      const averageProgress =
        objectiveCount > 0 ? Math.round(progressSum / objectiveCount) : 0;
      return {
        departmentId: d._id,
        name: d.name,
        color: d.color,
        headName: d.headId ? (headNameById.get(d.headId) ?? null) : null,
        employeeCount: employeesByDept.get(d.name) ?? 0,
        objectiveCount,
        averageProgress,
        onTrack,
        atRisk,
        offTrack,
        achieved,
        riskCount: atRisk + offTrack,
        rag: ragForUnit(objectiveCount, offTrack, atRisk, averageProgress),
      };
    });

    units.sort((a, b) => {
      if (RAG_ORDER[a.rag] !== RAG_ORDER[b.rag]) {
        return RAG_ORDER[a.rag] - RAG_ORDER[b.rag];
      }
      return a.averageProgress - b.averageProgress;
    });

    return { hasAccess: true, periodLabel: label, units };
  },
});

// ---------------------------------------------------------------------------
// Automatic escalations to the BoD ("Perlu Perhatian Direksi")
//
// Rules that automatically raise risk signals to the board, derived live from
// existing data (no cron / denormalization needed):
//   - Strategic OKR objectives (company/department scope, running year) whose
//     health is off_track (critical) or at_risk (high).
//   - Strategic issues that are not resolved and are either overdue (critical)
//     or high/critical urgency (high/critical).
// Everything is tenant-scoped and read-only. The board uses this to close the
// loop: deviating KPI -> strategic issue -> director decision.
// ---------------------------------------------------------------------------

export type EscalationSeverity = "critical" | "high";
export type EscalationSource = "okr" | "issue";

export type EscalationItem = {
  key: string;
  source: EscalationSource;
  severity: EscalationSeverity;
  title: string;
  reason: string;
  context: string | null; // e.g. department name / owner
  link: string; // route to the source module
};

export type EscalationsResult = {
  hasAccess: boolean;
  generatedAt: string;
  criticalCount: number;
  highCount: number;
  items: Array<EscalationItem>;
};

const OKR_HEALTH_LABEL: Record<string, string> = {
  off_track: "Menyimpang",
  at_risk: "Berisiko",
};
const ISSUE_URGENCY_LABEL: Record<string, string> = {
  critical: "Kritis",
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

const SEVERITY_ORDER: Record<EscalationSeverity, number> = {
  critical: 0,
  high: 1,
};

export const getEscalations = query({
  args: {},
  handler: async (ctx): Promise<EscalationsResult> => {
    const { period } = currentYearPeriod();
    const user = await getCurrentUser(ctx);

    const empty: EscalationsResult = {
      hasAccess: false,
      generatedAt: new Date().toISOString(),
      criticalCount: 0,
      highCount: 0,
      items: [],
    };

    if (!isExecutiveRole(user.role)) return empty;

    const orgId = user.organizationId ?? null;
    if (!orgId) {
      return { ...empty, hasAccess: true };
    }

    const [objectives, issues] = await Promise.all([
      ctx.db
        .query("objectives")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("strategicIssues")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
    ]);

    const items: Array<EscalationItem> = [];

    // --- Deviating strategic OKR objectives ---
    for (const o of objectives) {
      if (o.period !== period) continue;
      if (o.status === "archived") continue;
      if (o.scope !== "company" && o.scope !== "department") continue;
      if (o.health !== "off_track" && o.health !== "at_risk") continue;

      const severity: EscalationSeverity =
        o.health === "off_track" ? "critical" : "high";
      const scopeLabel =
        o.scope === "company" ? "OKR Perusahaan" : "OKR Departemen";
      items.push({
        key: `okr-${o._id}`,
        source: "okr",
        severity,
        title: o.title,
        reason: `${scopeLabel} ${OKR_HEALTH_LABEL[o.health] ?? o.health} · progres ${o.progress}%`,
        context: o.scope === "department" ? (o.department ?? null) : null,
        link: "/okr",
      });
    }

    // --- Strategic issues that are overdue or high/critical urgency ---
    const nowIso = new Date().toISOString();
    for (const issue of issues) {
      if (issue.status === "resolved") continue;
      const overdue = !!issue.dueDate && issue.dueDate < nowIso;
      const urgentEnough =
        issue.urgency === "critical" || issue.urgency === "high";
      if (!overdue && !urgentEnough) continue;

      const severity: EscalationSeverity =
        overdue || issue.urgency === "critical" ? "critical" : "high";
      const reason = overdue
        ? `Isu strategis melewati tenggat · urgensi ${ISSUE_URGENCY_LABEL[issue.urgency] ?? issue.urgency}`
        : `Isu strategis urgensi ${ISSUE_URGENCY_LABEL[issue.urgency] ?? issue.urgency}`;
      items.push({
        key: `issue-${issue._id}`,
        source: "issue",
        severity,
        title: issue.title,
        reason,
        context: issue.department ?? null,
        link: "/strategic-issues",
      });
    }

    // Most severe first; keep a stable order within a tier.
    items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

    const criticalCount = items.filter((i) => i.severity === "critical").length;
    const highCount = items.filter((i) => i.severity === "high").length;

    return {
      hasAccess: true,
      generatedAt: new Date().toISOString(),
      criticalCount,
      highCount,
      items,
    };
  },
});

export type UnitObjective = {
  _id: Id<"objectives">;
  title: string;
  progress: number;
  health: string;
  category: string;
  ownerName: string | null;
  keyResultCount: number;
};

export type UnitDetail = {
  hasAccess: boolean;
  found: boolean;
  periodLabel: string;
  name: string;
  color: string;
  headName: string | null;
  employeeCount: number;
  averageProgress: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  achieved: number;
  objectives: Array<UnitObjective>;
};

export const getUnitDetail = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args): Promise<UnitDetail> => {
    const { period, label } = currentYearPeriod();
    const user = await getCurrentUser(ctx);

    const empty: UnitDetail = {
      hasAccess: isExecutiveRole(user.role),
      found: false,
      periodLabel: label,
      name: "",
      color: "slate",
      headName: null,
      employeeCount: 0,
      averageProgress: 0,
      onTrack: 0,
      atRisk: 0,
      offTrack: 0,
      achieved: 0,
      objectives: [],
    };

    if (!isExecutiveRole(user.role)) return empty;

    const orgId = user.organizationId ?? null;
    const department = await ctx.db.get(args.departmentId);
    if (!department) return empty;
    // Tenant isolation: never reveal a department from another organization.
    if (orgId && department.organizationId && department.organizationId !== orgId) {
      return empty;
    }

    const head = department.headId ? await ctx.db.get(department.headId) : null;

    // Employees whose department name matches.
    const orgUsers = orgId
      ? await ctx.db
          .query("users")
          .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
          .collect()
          .then((all) => all.filter(isCountableEmployee))
      : [];
    const employeeCount = orgUsers.filter(
      (u) => u.department === department.name,
    ).length;

    // Department-scoped objectives for this department in the running year.
    const objectives = (
      orgId
        ? await ctx.db
            .query("objectives")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect()
        : []
    ).filter(
      (o) =>
        o.period === period &&
        o.status !== "archived" &&
        o.scope === "department" &&
        o.department === department.name,
    );

    // Resolve owner names.
    const ownerIds = Array.from(new Set(objectives.map((o) => o.ownerId)));
    const owners = await Promise.all(ownerIds.map((id) => ctx.db.get(id)));
    const ownerNameById = new Map<Id<"users">, string>();
    for (const o of owners) {
      if (o) ownerNameById.set(o._id, o.name ?? "Tanpa nama");
    }

    let onTrack = 0;
    let atRisk = 0;
    let offTrack = 0;
    let achieved = 0;
    let progressSum = 0;
    for (const o of objectives) {
      if (o.health === "on_track") onTrack += 1;
      else if (o.health === "at_risk") atRisk += 1;
      else if (o.health === "off_track") offTrack += 1;
      else if (o.health === "achieved") achieved += 1;
      progressSum += o.progress;
    }
    const averageProgress =
      objectives.length > 0 ? Math.round(progressSum / objectives.length) : 0;

    const objectiveRows: Array<UnitObjective> = objectives
      .map((o) => ({
        _id: o._id,
        title: o.title,
        progress: o.progress,
        health: o.health,
        category: o.category,
        ownerName: ownerNameById.get(o.ownerId) ?? null,
        keyResultCount: o.keyResultCount,
      }))
      .sort((a, b) => a.progress - b.progress);

    return {
      hasAccess: true,
      found: true,
      periodLabel: label,
      name: department.name,
      color: department.color,
      headName: head?.name ?? null,
      employeeCount,
      averageProgress,
      onTrack,
      atRisk,
      offTrack,
      achieved,
      objectives: objectiveRows,
    };
  },
});
