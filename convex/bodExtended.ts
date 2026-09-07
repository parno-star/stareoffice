import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";
import { requireTenant } from "./lib/tenant";
import { isExecutiveRole } from "./roles";

// ---------------------------------------------------------------------------
// BoD Extended – Divisions, KPI Reports, Risk, Audit, HSE
// ---------------------------------------------------------------------------

async function requireExec(ctx: Parameters<typeof requireTenant>[0]) {
  const { userId } = await requireTenant(ctx, { allowSuperAdmin: true });
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  if (!isExecutiveRole(user.role) && user.role !== "admin" && user.role !== "super_admin") {
    throw new ConvexError({ code: "FORBIDDEN", message: "Akses ditolak" });
  }
  return user;
}

function currentPeriod(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ---------------------------------------------------------------------------
// DIVISIONS
// ---------------------------------------------------------------------------

export const getDivisions = query({
  args: {},
  handler: async (ctx): Promise<Array<Doc<"bodDivisions">>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const orgId = user.organizationId ?? undefined;
    // Jika user punya org → filter by org; jika tidak → tampilkan semua (single-tenant)
    const rows = orgId
      ? await ctx.db
          .query("bodDivisions")
          .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
          .collect()
      : await ctx.db.query("bodDivisions").collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const upsertDivision = mutation({
  args: {
    id: v.optional(v.id("bodDivisions")),
    name: v.string(),
    type: v.union(v.literal("jasa"), v.literal("manufaktur")),
    code: v.optional(v.string()),
    headName: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Semua user terautentikasi boleh menyimpan, tapi user biasa
    // hanya boleh menyimpan departemennya sendiri.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User tidak ditemukan" });

    const orgId = user.organizationId ?? undefined;

    // User biasa: boleh simpan departemen apa pun (manual), tapi validasi tetap dilakukan
    // Hanya super_admin/admin yang bisa simpan departemen org lain (multi-tenant)
    // Untuk single-tenant atau user tanpa org, semua diizinkan

    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name,
        type: args.type,
        code: args.code,
        headName: args.headName,
        isActive: args.isActive,
        order: args.order,
        updatedAt: new Date().toISOString(),
      });
      return args.id;
    }
    return ctx.db.insert("bodDivisions", {
      organizationId: orgId,
      name: args.name,
      type: args.type,
      code: args.code,
      headName: args.headName,
      isActive: args.isActive,
      order: args.order,
      createdAt: new Date().toISOString(),
    });
  },
});

export const deleteDivision = mutation({
  args: { id: v.id("bodDivisions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu" });
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// KPI REPORTS  (Revenue / Production / HR)
// ---------------------------------------------------------------------------

export const getKpiReports = query({
  args: { period: v.optional(v.string()), category: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Array<Doc<"bodKpiReports">>> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return [];
    const period = args.period ?? currentPeriod();
    if (args.category) {
      return ctx.db
        .query("bodKpiReports")
        .withIndex("by_org_period_category", (q) =>
          q.eq("organizationId", orgId).eq("period", period).eq("category", args.category!)
        )
        .collect();
    }
    return ctx.db
      .query("bodKpiReports")
      .withIndex("by_org_and_period", (q) => q.eq("organizationId", orgId).eq("period", period))
      .collect();
  },
});

export const upsertKpiReport = mutation({
  args: {
    period: v.string(),
    category: v.string(),
    division: v.string(),
    divisionType: v.string(),
    data: v.string(),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) throw new ConvexError({ code: "FORBIDDEN", message: "No organization" });

    // Check existing
    const existing = await ctx.db
      .query("bodKpiReports")
      .withIndex("by_org_period_division", (q) =>
        q.eq("organizationId", orgId).eq("period", args.period).eq("division", args.division)
      )
      .first();

    // Filter to only matching category
    const filteredExisting = existing?.category === args.category ? existing : null;

    if (filteredExisting) {
      await ctx.db.patch(filteredExisting._id, {
        divisionType: args.divisionType,
        data: args.data,
        status: args.status,
        note: args.note,
        submittedBy: user._id,
        submittedAt: new Date().toISOString(),
      });
      return filteredExisting._id;
    }

    return ctx.db.insert("bodKpiReports", {
      organizationId: orgId,
      period: args.period,
      category: args.category,
      division: args.division,
      divisionType: args.divisionType,
      data: args.data,
      status: args.status,
      note: args.note,
      submittedBy: user._id,
      submittedAt: new Date().toISOString(),
    });
  },
});

// Bulk upsert – used when importing from Excel
export const bulkUpsertKpiReports = mutation({
  args: {
    period: v.string(),
    category: v.string(),
    reports: v.array(
      v.object({
        division: v.string(),
        divisionType: v.string(),
        data: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) throw new ConvexError({ code: "FORBIDDEN", message: "No organization" });
    const now = new Date().toISOString();
    for (const r of args.reports) {
      const existing = await ctx.db
        .query("bodKpiReports")
        .withIndex("by_org_period_division", (q) =>
          q.eq("organizationId", orgId).eq("period", args.period).eq("division", r.division)
        )
        .collect()
        .then((rows) => rows.find((x) => x.category === args.category) ?? null);

      if (existing) {
        await ctx.db.patch(existing._id, {
          divisionType: r.divisionType,
          data: r.data,
          status: "final",
          submittedBy: user._id,
          submittedAt: now,
        });
      } else {
        await ctx.db.insert("bodKpiReports", {
          organizationId: orgId,
          period: args.period,
          category: args.category,
          division: r.division,
          divisionType: r.divisionType,
          data: r.data,
          status: "final",
          submittedBy: user._id,
          submittedAt: now,
        });
      }
    }
    return args.reports.length;
  },
});

// ---------------------------------------------------------------------------
// RISK ITEMS
// ---------------------------------------------------------------------------

export const getRiskItems = query({
  args: { period: v.optional(v.string()), division: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Array<Doc<"bodRiskItems">>> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return [];
    const period = args.period ?? currentPeriod();
    if (args.division) {
      return ctx.db
        .query("bodRiskItems")
        .withIndex("by_org_period_division", (q) =>
          q.eq("organizationId", orgId).eq("period", period).eq("division", args.division!)
        )
        .collect();
    }
    return ctx.db
      .query("bodRiskItems")
      .withIndex("by_org_and_period", (q) => q.eq("organizationId", orgId).eq("period", period))
      .collect();
  },
});

export const upsertRiskItem = mutation({
  args: {
    id: v.optional(v.id("bodRiskItems")),
    period: v.string(),
    division: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    likelihood: v.number(),
    impact: v.number(),
    mitigationPlan: v.optional(v.string()),
    status: v.string(),
    owner: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) throw new ConvexError({ code: "FORBIDDEN", message: "No organization" });
    const riskScore = args.likelihood * args.impact;
    const riskLevel =
      riskScore >= 20 ? "critical" : riskScore >= 12 ? "high" : riskScore >= 6 ? "medium" : "low";
    const now = new Date().toISOString();
    if (args.id) {
      await ctx.db.patch(args.id, {
        title: args.title,
        description: args.description,
        category: args.category,
        likelihood: args.likelihood,
        impact: args.impact,
        riskScore,
        riskLevel,
        mitigationPlan: args.mitigationPlan,
        status: args.status,
        owner: args.owner,
        dueDate: args.dueDate,
        updatedAt: now,
      });
      return args.id;
    }
    return ctx.db.insert("bodRiskItems", {
      organizationId: orgId,
      period: args.period,
      division: args.division,
      title: args.title,
      description: args.description,
      category: args.category,
      likelihood: args.likelihood,
      impact: args.impact,
      riskScore,
      riskLevel,
      mitigationPlan: args.mitigationPlan,
      status: args.status,
      owner: args.owner,
      dueDate: args.dueDate,
      createdBy: user._id,
      createdAt: now,
    });
  },
});

export const deleteRiskItem = mutation({
  args: { id: v.id("bodRiskItems") },
  handler: async (ctx, args) => {
    await requireExec(ctx);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// AUDIT FINDINGS
// ---------------------------------------------------------------------------

export const getAuditFindings = query({
  args: { period: v.optional(v.string()), division: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Array<Doc<"bodAuditFindings">>> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return [];
    const period = args.period ?? currentPeriod();
    if (args.division) {
      return ctx.db
        .query("bodAuditFindings")
        .withIndex("by_org_period_division", (q) =>
          q.eq("organizationId", orgId).eq("period", period).eq("division", args.division!)
        )
        .collect();
    }
    return ctx.db
      .query("bodAuditFindings")
      .withIndex("by_org_and_period", (q) => q.eq("organizationId", orgId).eq("period", period))
      .collect();
  },
});

export const upsertAuditFinding = mutation({
  args: {
    id: v.optional(v.id("bodAuditFindings")),
    period: v.string(),
    division: v.string(),
    auditTitle: v.string(),
    findingTitle: v.string(),
    description: v.optional(v.string()),
    severity: v.string(),
    status: v.string(),
    recommendation: v.optional(v.string()),
    actionPlan: v.optional(v.string()),
    responsiblePerson: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    closedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) throw new ConvexError({ code: "FORBIDDEN", message: "No organization" });
    const now = new Date().toISOString();
    if (args.id) {
      const { id: _id, ...rest } = args;
      await ctx.db.patch(args.id, { ...rest, updatedAt: now });
      return args.id;
    }
    return ctx.db.insert("bodAuditFindings", {
      organizationId: orgId,
      period: args.period,
      division: args.division,
      auditTitle: args.auditTitle,
      findingTitle: args.findingTitle,
      description: args.description,
      severity: args.severity,
      status: args.status,
      recommendation: args.recommendation,
      actionPlan: args.actionPlan,
      responsiblePerson: args.responsiblePerson,
      dueDate: args.dueDate,
      closedDate: args.closedDate,
      createdBy: user._id,
      createdAt: now,
    });
  },
});

export const deleteAuditFinding = mutation({
  args: { id: v.id("bodAuditFindings") },
  handler: async (ctx, args) => {
    await requireExec(ctx);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// HSE INCIDENTS
// ---------------------------------------------------------------------------

export const getHseIncidents = query({
  args: { period: v.optional(v.string()), division: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Array<Doc<"bodHseIncidents">>> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return [];
    const period = args.period ?? currentPeriod();
    if (args.division) {
      return ctx.db
        .query("bodHseIncidents")
        .withIndex("by_org_period_division", (q) =>
          q.eq("organizationId", orgId).eq("period", period).eq("division", args.division!)
        )
        .collect();
    }
    return ctx.db
      .query("bodHseIncidents")
      .withIndex("by_org_and_period", (q) => q.eq("organizationId", orgId).eq("period", period))
      .collect();
  },
});

export const upsertHseIncident = mutation({
  args: {
    id: v.optional(v.id("bodHseIncidents")),
    period: v.string(),
    division: v.string(),
    incidentDate: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    severity: v.string(),
    location: v.optional(v.string()),
    injuredCount: v.number(),
    lostDays: v.number(),
    rootCause: v.optional(v.string()),
    correctiveAction: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) throw new ConvexError({ code: "FORBIDDEN", message: "No organization" });
    const now = new Date().toISOString();
    if (args.id) {
      const { id: _id, ...rest } = args;
      await ctx.db.patch(args.id, { ...rest });
      return args.id;
    }
    return ctx.db.insert("bodHseIncidents", {
      organizationId: orgId,
      period: args.period,
      division: args.division,
      incidentDate: args.incidentDate,
      title: args.title,
      description: args.description,
      type: args.type,
      severity: args.severity,
      location: args.location,
      injuredCount: args.injuredCount,
      lostDays: args.lostDays,
      rootCause: args.rootCause,
      correctiveAction: args.correctiveAction,
      status: args.status,
      createdBy: user._id,
      createdAt: now,
    });
  },
});

export const deleteHseIncident = mutation({
  args: { id: v.id("bodHseIncidents") },
  handler: async (ctx, args) => {
    await requireExec(ctx);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// CONSOLIDATED SUMMARY for the new BoD tabs
// ---------------------------------------------------------------------------

export type BodRiskSummary = {
  hasAccess: boolean;
  period: string;
  totalRisks: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  openRisks: number;
  byDivision: Array<{ division: string; count: number; maxLevel: string }>;
};

export type BodAuditSummary = {
  hasAccess: boolean;
  period: string;
  total: number;
  critical: number;
  major: number;
  minor: number;
  observation: number;
  open: number;
  inProgress: number;
  closed: number;
  overdue: number;
};

export type BodHseSummary = {
  hasAccess: boolean;
  period: string;
  totalIncidents: number;
  totalInjured: number;
  totalLostDays: number;
  nearMiss: number;
  lostTime: number;
  fatality: number;
  byDivision: Array<{ division: string; count: number; severity: string }>;
};

export type BodRevenueSummary = {
  hasAccess: boolean;
  period: string;
  totalRevenue: number;
  totalBudget: number;         // = totalRevenue.program
  achievement: number;
  totalGrossProfit: number;
  grossProfitProgram: number;  // program (target) untuk Gross Profit
  grossProfitMargin: number;
  totalEbitda: number;
  ebitdaProgram: number;       // program (target) untuk EBITDA
  ebitdaMargin: number;
  totalCashFlow: number;
  cashFlowProgram: number;     // program (target) untuk Cash Flow
  totalAr: number;
  arProgram: number;           // program (target) untuk AR
  totalAp: number;
  apProgram: number;           // program (target) untuk AP
  totalCost: number;
  totalCostProgram: number;    // program (target) untuk Total Biaya
  totalNetProfit: number;
  netProfitProgram: number;    // program (target) untuk Laba Bersih
  byDivision: Array<{
    division: string;
    type: string;
    revenue: number;
    budget: number;
    achievement: number;
    grossProfit: number;
    ebitda: number;
    cashFlow: number;
    ar: number;
    ap: number;
  }>;
  // Rincian pendapatan per lini bisnis (dari laporan keuangan)
  revenueByLine: Array<{ name: string; program: number; realisasi: number }>;
};

export type BodRevenueTrend = {
  hasAccess: boolean;
  periods: Array<{
    period: string;
    totalRevenue: number;    totalBudget: number;    achievement: number;
    totalCost: number;       totalCostProgram: number;
    grossProfit: number;     grossProfitProgram: number;
    ebitda: number;          ebitdaProgram: number;
    netProfit: number;       netProfitProgram: number;
    cashFlow: number;        cashFlowProgram: number;
    ar: number;              arProgram: number;
    ap: number;              apProgram: number;
    revenueByLine: Array<{ name: string; program: number; realisasi: number }>;
  }>;
};

export type BodHrSummary = {
  hasAccess: boolean;
  period: string;
  totalHeadcount: number;
  attendanceRate: number;
  productivityScore: number;
  totalPayroll: number;
  avgSalary: number;
  totalAbsent: number;
  totalOvertime: number;
  totalTrainingHours: number;
  turnoverRate: number;
  jasaHeadcount: number;
  manufakturHeadcount: number;
  byDivision: Array<{
    division: string;
    type: string;
    headcount: number;
    attendanceRate: number;
    productivity: number;
    payroll: number;
    avgSalary: number;
    absentDays: number;
    overtimeHours: number;
    trainingHours: number;
    turnoverRate: number;
  }>;
};

export type BodHrTrend = {
  hasAccess: boolean;
  periods: Array<{
    period: string;
    totalHeadcount: number;
    attendanceRate: number;
    productivityScore: number;
    totalPayroll: number;
  }>;
};

export type BodProductionSummary = {
  hasAccess: boolean;
  period: string;
  activeProjects: number;
  onTrackProjects: number;
  atRiskProjects: number;
  delayedProjects: number;
  completedProjects: number;
  otdRate: number;
  avgCapacityUtilization: number;
  totalOutputVolume: number;
  totalPipelineValue: number;
  jasaProjects: number;
  manufakturProjects: number;
  byDivision: Array<{
    division: string;
    type: string;
    projects: number;
    onTrack: number;
    atRisk: number;
    delayed: number;
    completed: number;
    otd: number;
    capacityUtilization: number;
    outputVolume: number;
    pipelineValue: number;
  }>;
};

export type BodProductionTrend = {
  hasAccess: boolean;
  periods: Array<{
    period: string;
    activeProjects: number;
    otdRate: number;
    delayedProjects: number;
  }>;
};

export const getRiskSummary = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args): Promise<BodRiskSummary> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    const period = args.period ?? currentPeriod();
    const empty: BodRiskSummary = {
      hasAccess: true, period, totalRisks: 0, critical: 0, high: 0, medium: 0, low: 0,
      openRisks: 0, byDivision: [],
    };
    if (!orgId) return empty;

    const items = await ctx.db
      .query("bodRiskItems")
      .withIndex("by_org_and_period", (q) => q.eq("organizationId", orgId).eq("period", period))
      .collect();

    let critical = 0, high = 0, medium = 0, low = 0, openRisks = 0;
    const divMap = new Map<string, { count: number; maxScore: number; maxLevel: string }>();
    for (const r of items) {
      if (r.riskLevel === "critical") critical++;
      else if (r.riskLevel === "high") high++;
      else if (r.riskLevel === "medium") medium++;
      else low++;
      if (r.status === "open") openRisks++;
      const d = divMap.get(r.division) ?? { count: 0, maxScore: 0, maxLevel: "low" };
      d.count++;
      if (r.riskScore > d.maxScore) { d.maxScore = r.riskScore; d.maxLevel = r.riskLevel; }
      divMap.set(r.division, d);
    }
    return {
      hasAccess: true, period, totalRisks: items.length, critical, high, medium, low, openRisks,
      byDivision: Array.from(divMap.entries()).map(([division, v]) => ({
        division, count: v.count, maxLevel: v.maxLevel,
      })).sort((a, b) => b.count - a.count),
    };
  },
});

export const getAuditSummary = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args): Promise<BodAuditSummary> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    const period = args.period ?? currentPeriod();
    const empty: BodAuditSummary = {
      hasAccess: true, period, total: 0, critical: 0, major: 0, minor: 0, observation: 0,
      open: 0, inProgress: 0, closed: 0, overdue: 0,
    };
    if (!orgId) return empty;

    const items = await ctx.db
      .query("bodAuditFindings")
      .withIndex("by_org_and_period", (q) => q.eq("organizationId", orgId).eq("period", period))
      .collect();

    let critical = 0, major = 0, minor = 0, observation = 0;
    let open = 0, inProgress = 0, closed = 0, overdue = 0;
    for (const f of items) {
      if (f.severity === "critical") critical++;
      else if (f.severity === "major") major++;
      else if (f.severity === "minor") minor++;
      else observation++;
      if (f.status === "open") open++;
      else if (f.status === "in_progress") inProgress++;
      else if (f.status === "closed") closed++;
      else if (f.status === "overdue") overdue++;
    }
    return { hasAccess: true, period, total: items.length, critical, major, minor, observation, open, inProgress, closed, overdue };
  },
});

export const getHseSummary = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args): Promise<BodHseSummary> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    const period = args.period ?? currentPeriod();
    const empty: BodHseSummary = {
      hasAccess: true, period, totalIncidents: 0, totalInjured: 0, totalLostDays: 0,
      nearMiss: 0, lostTime: 0, fatality: 0, byDivision: [],
    };
    if (!orgId) return empty;

    const items = await ctx.db
      .query("bodHseIncidents")
      .withIndex("by_org_and_period", (q) => q.eq("organizationId", orgId).eq("period", period))
      .collect();

    let totalInjured = 0, totalLostDays = 0, nearMiss = 0, lostTime = 0, fatality = 0;
    const divMap = new Map<string, { count: number; severity: string }>();
    for (const i of items) {
      totalInjured += i.injuredCount;
      totalLostDays += i.lostDays;
      if (i.type === "near_miss") nearMiss++;
      if (i.type === "lost_time") lostTime++;
      if (i.type === "fatality") fatality++;
      const d = divMap.get(i.division) ?? { count: 0, severity: "low" };
      d.count++;
      if (i.severity === "critical" || (i.severity === "high" && d.severity !== "critical")) d.severity = i.severity;
      divMap.set(i.division, d);
    }
    return {
      hasAccess: true, period, totalIncidents: items.length, totalInjured, totalLostDays,
      nearMiss, lostTime, fatality,
      byDivision: Array.from(divMap.entries()).map(([division, v]) => ({
        division, count: v.count, severity: v.severity,
      })).sort((a, b) => b.count - a.count),
    };
  },
});

export const getRevenueSummary = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args): Promise<BodRevenueSummary> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    const period = args.period ?? currentPeriod();
    const empty: BodRevenueSummary = {
      hasAccess: true, period, totalRevenue: 0, totalBudget: 0, achievement: 0,
      totalGrossProfit: 0, grossProfitProgram: 0, grossProfitMargin: 0,
      totalEbitda: 0, ebitdaProgram: 0, ebitdaMargin: 0,
      totalCashFlow: 0, cashFlowProgram: 0, totalAr: 0, arProgram: 0,
      totalAp: 0, apProgram: 0, totalCost: 0, totalCostProgram: 0,
      totalNetProfit: 0, netProfitProgram: 0,
      byDivision: [],
      revenueByLine: [],
    };

    // Jika orgId ada → filter by org; jika tidak (single-tenant/super_admin) → lanjut tanpa filter orgId
    const reports = orgId
      ? await ctx.db
          .query("bodKpiReports")
          .withIndex("by_org_period_category", (q) =>
            q.eq("organizationId", orgId).eq("period", period).eq("category", "revenue")
          )
          .collect()
      : [];

    let totalRevenue = 0, totalBudget = 0, totalGrossProfit = 0, totalEbitda = 0;
    let totalCashFlow = 0, totalAr = 0, totalAp = 0;
    let totalCost = 0;
    type RawData = { revenue?: number; budget?: number; grossProfit?: number; ebitda?: number; cashFlow?: number; ar?: number; ap?: number };
    const byDivision = reports.map((r) => {
      let data: RawData = {};
      try { data = JSON.parse(r.data) as RawData; } catch { /* ignore */ }
      const revenue = data.revenue ?? 0;
      const budget = data.budget ?? 0;
      const grossProfit = data.grossProfit ?? Math.round(revenue * 0.35);
      const ebitda = data.ebitda ?? Math.round(revenue * 0.2);
      const cashFlow = data.cashFlow ?? 0;
      const ar = data.ar ?? 0;
      const ap = data.ap ?? 0;
      const achievement = budget > 0 ? Math.round((revenue / budget) * 100) : 0;
      totalRevenue += revenue;
      totalBudget += budget;
      totalGrossProfit += grossProfit;
      totalEbitda += ebitda;
      totalCashFlow += cashFlow;
      totalAr += ar;
      totalAp += ap;

      return { division: r.division, type: r.divisionType, revenue, budget, achievement, grossProfit, ebitda, cashFlow, ar, ap };
    });

    // Nilai final agregat dari bodKpiReports (bisa di-override oleh financeReports)
    let fTotalRevenue = totalRevenue;
    let fTotalBudget = totalBudget;
    let fTotalGrossProfit = totalGrossProfit;
    let fTotalEbitda = totalEbitda;
    let fTotalCashFlow = totalCashFlow;
    let fTotalAr = totalAr;
    let fTotalAp = totalAp;
    let fTotalCost = totalCost;
    let fTotalNetProfit = 0;

    // Program (target) — default estimasi (backward compat) selama financeReports belum ada
    let grossProfitProgram = Math.round(totalBudget * 0.35);
    let ebitdaProgram = Math.round(totalBudget * 0.2);
    let cashFlowProgram = 0;
    let arProgram = 0;
    let apProgram = 0;
    let totalCostProgram = 0;
    let netProfitProgram = 0;

    // ── Override dengan financeReports (status "final") jika tersedia ──
    // Jika orgId ada → filter by org+period; jika tidak (super_admin/single-tenant) → cari by period saja
    let financeReport = orgId
      ? await ctx.db
          .query("financeReports")
          .withIndex("by_org_period", (q) => q.eq("organizationId", orgId).eq("period", period))
          .unique()
      : await ctx.db
          .query("financeReports")
          .withIndex("by_org_period", (q) => q.eq("organizationId", undefined).eq("period", period))
          .unique();

    // Jika tidak ada laporan langsung untuk periode ini (triwulan/semester/tahun),
    // coba agregasikan dari data bulan-bulan yang tercakup
    let aggregatedFd: FinanceReportData | null = null;
    if ((!financeReport || financeReport.status !== "final") && monthsForPeriod(period).length > 1) {
      aggregatedFd = await aggregateMonthsForPeriod(ctx, orgId, period);
    }

    const fdSource: FinanceReportData | null = (financeReport && financeReport.status === "final")
      ? normalizeFinanceData(financeReport.data)
      : aggregatedFd;

    let revenueByLine: Array<{ name: string; program: number; realisasi: number }> = [];

    if (fdSource) {
      const fd = fdSource;
      fTotalRevenue = fd.totalRevenue.realisasi;
      fTotalBudget = fd.totalRevenue.program;
      fTotalGrossProfit = fd.grossProfit.realisasi;
      fTotalEbitda = fd.ebitda.realisasi;
      fTotalCashFlow = fd.cashFlow.realisasi;
      fTotalAr = fd.ar.realisasi;
      fTotalAp = fd.ap.realisasi;
      fTotalCost = fd.totalCost.realisasi;
      totalCostProgram = fd.totalCost.program;
      fTotalNetProfit = fd.netProfit.realisasi;
      netProfitProgram = fd.netProfit.program;
      grossProfitProgram = fd.grossProfit.program;
      ebitdaProgram = fd.ebitda.program;
      cashFlowProgram = fd.cashFlow.program;
      arProgram = fd.ar.program;
      apProgram = fd.ap.program;
      revenueByLine = fd.revenueByLine ?? [];
    }

    // Gabungkan dengan daftar master lini bisnis: tampilkan kartu untuk tiap nama
    // yang sudah didefinisikan meski nilainya belum diisi (program/realisasi 0).
    const masterRow = await ctx.db
      .query("bodTabConfig")
      .withIndex("by_org_and_tab", (q) => q.eq("organizationId", orgId).eq("tabKey", REVENUE_LINES_TAB_KEY))
      .unique();
    let masterNames: string[] = [];
    if (masterRow) {
      try {
        const parsed = JSON.parse(masterRow.config) as unknown;
        if (Array.isArray(parsed)) masterNames = parsed.filter((x): x is string => typeof x === "string");
      } catch { /* ignore */ }
    }
    if (masterNames.length > 0) {
      const valueMap = new Map(revenueByLine.map((l) => [l.name.toLowerCase(), l]));
      const merged: Array<{ name: string; program: number; realisasi: number }> = [];
      const usedKeys = new Set<string>();
      // Urutan mengikuti daftar master
      for (const name of masterNames) {
        const key = name.toLowerCase();
        const existing = valueMap.get(key);
        merged.push(existing ? { ...existing, name } : { name, program: 0, realisasi: 0 });
        usedKeys.add(key);
      }
      // Tambahkan lini bisnis yang punya nilai tapi tidak ada di daftar master (data lama)
      for (const l of revenueByLine) {
        if (!usedKeys.has(l.name.toLowerCase())) merged.push(l);
      }
      revenueByLine = merged;
    }

    return {
      hasAccess: true, period,
      totalRevenue: fTotalRevenue, totalBudget: fTotalBudget,
      achievement: fTotalBudget > 0 ? Math.round((fTotalRevenue / fTotalBudget) * 100) : 0,
      totalGrossProfit: fTotalGrossProfit,
      grossProfitProgram,
      grossProfitMargin: fTotalRevenue > 0 ? Math.round((fTotalGrossProfit / fTotalRevenue) * 100) : 0,
      totalEbitda: fTotalEbitda,
      ebitdaProgram,
      ebitdaMargin: fTotalRevenue > 0 ? Math.round((fTotalEbitda / fTotalRevenue) * 100) : 0,
      totalCashFlow: fTotalCashFlow, cashFlowProgram,
      totalAr: fTotalAr, arProgram,
      totalAp: fTotalAp, apProgram,
      totalCost: fTotalCost, totalCostProgram,
      totalNetProfit: fTotalNetProfit, netProfitProgram,
      byDivision: byDivision.sort((a, b) => b.revenue - a.revenue),
      revenueByLine,
    };
  },
});

export const getRevenueTrend = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args): Promise<BodRevenueTrend> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;

    const months = args.months ?? 6;
    // Build list of last N periods (YYYY-MM)
    const now = new Date();
    const targetPeriods: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targetPeriods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const results = await Promise.all(
      targetPeriods.map(async (period) => {
        // Cek financeReports (status final) terlebih dahulu
        const financeReport = orgId
          ? await ctx.db.query("financeReports")
              .withIndex("by_org_period", (q) => q.eq("organizationId", orgId).eq("period", period))
              .unique()
          : await ctx.db.query("financeReports")
              .withIndex("by_org_period", (q) => q.eq("organizationId", undefined).eq("period", period))
              .unique();

        if (financeReport && financeReport.status === "final") {
          const fd = normalizeFinanceData(financeReport.data);
          const totalRevenue = fd.totalRevenue.realisasi;
          const totalBudget  = fd.totalRevenue.program;
          const achievement  = totalBudget > 0 ? Math.round((totalRevenue / totalBudget) * 100) : 0;
          return {
            period, totalRevenue, totalBudget, achievement,
            totalCost: fd.totalCost.realisasi,       totalCostProgram: fd.totalCost.program,
            grossProfit: fd.grossProfit.realisasi,   grossProfitProgram: fd.grossProfit.program,
            ebitda: fd.ebitda.realisasi,             ebitdaProgram: fd.ebitda.program,
            netProfit: fd.netProfit.realisasi,       netProfitProgram: fd.netProfit.program,
            cashFlow: fd.cashFlow.realisasi,         cashFlowProgram: fd.cashFlow.program,
            ar: fd.ar.realisasi,                     arProgram: fd.ar.program,
            ap: fd.ap.realisasi,                     apProgram: fd.ap.program,
            revenueByLine: (fd.revenueByLine ?? []).map((l) => ({ name: l.name, program: l.program, realisasi: l.realisasi })),
          };
        }

        // Fallback: bodKpiReports (hanya jika ada orgId)
        const zero = { period, totalRevenue: 0, totalBudget: 0, achievement: 0, totalCost: 0, totalCostProgram: 0, grossProfit: 0, grossProfitProgram: 0, ebitda: 0, ebitdaProgram: 0, netProfit: 0, netProfitProgram: 0, cashFlow: 0, cashFlowProgram: 0, ar: 0, arProgram: 0, ap: 0, apProgram: 0, revenueByLine: [] };
        if (!orgId) return zero;

        const reports = await ctx.db
          .query("bodKpiReports")
          .withIndex("by_org_period_category", (q) =>
            q.eq("organizationId", orgId).eq("period", period).eq("category", "revenue")
          )
          .collect();
        type RawData = { revenue?: number; budget?: number };
        let totalRevenue = 0, totalBudget = 0;
        for (const r of reports) {
          let data: RawData = {};
          try { data = JSON.parse(r.data) as RawData; } catch { /* ignore */ }
          totalRevenue += data.revenue ?? 0;
          totalBudget += data.budget ?? 0;
        }
        const achievement = totalBudget > 0 ? Math.round((totalRevenue / totalBudget) * 100) : 0;
        return { period, totalRevenue, totalBudget, achievement, totalCost: 0, totalCostProgram: 0, grossProfit: 0, grossProfitProgram: 0, ebitda: 0, ebitdaProgram: 0, netProfit: 0, netProfitProgram: 0, cashFlow: 0, cashFlowProgram: 0, ar: 0, arProgram: 0, ap: 0, apProgram: 0, revenueByLine: [] };
      })
    );

    return { hasAccess: true, periods: results };
  },
});

export const getHrSummary = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args): Promise<BodHrSummary> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    const period = args.period ?? currentPeriod();
    const empty: BodHrSummary = {
      hasAccess: true, period, totalHeadcount: 0, attendanceRate: 0, productivityScore: 0,
      totalPayroll: 0, avgSalary: 0, totalAbsent: 0, totalOvertime: 0, totalTrainingHours: 0,
      turnoverRate: 0, jasaHeadcount: 0, manufakturHeadcount: 0, byDivision: [],
    };
    if (!orgId) return empty;

    const reports = await ctx.db
      .query("bodKpiReports")
      .withIndex("by_org_period_category", (q) =>
        q.eq("organizationId", orgId).eq("period", period).eq("category", "hr")
      )
      .collect();

    let totalHeadcount = 0, totalAttendance = 0, totalProductivity = 0, totalPayroll = 0;
    let totalAbsent = 0, totalOvertime = 0, totalTrainingHours = 0, totalTurnover = 0;
    let jasaHeadcount = 0, manufakturHeadcount = 0;
    type RawData = { headcount?: number; attendanceRate?: number; productivity?: number; payroll?: number; absentDays?: number; overtimeHours?: number; trainingHours?: number; turnoverRate?: number };
    const byDivision = reports.map((r) => {
      let data: RawData = {};
      try { data = JSON.parse(r.data) as RawData; } catch { /* ignore */ }
      const headcount = data.headcount ?? 0;
      const attendanceRate = data.attendanceRate ?? 0;
      const productivity = data.productivity ?? 0;
      const payroll = data.payroll ?? 0;
      const absentDays = data.absentDays ?? 0;
      const overtimeHours = data.overtimeHours ?? 0;
      const trainingHours = data.trainingHours ?? 0;
      const turnoverRate = data.turnoverRate ?? 0;
      const avgSalary = headcount > 0 ? Math.round(payroll / headcount) : 0;
      totalHeadcount += headcount;
      totalAttendance += attendanceRate;
      totalProductivity += productivity;
      totalPayroll += payroll;
      totalAbsent += absentDays;
      totalOvertime += overtimeHours;
      totalTrainingHours += trainingHours;
      totalTurnover += turnoverRate;
      if (r.divisionType === "jasa") jasaHeadcount += headcount;
      else manufakturHeadcount += headcount;
      return { division: r.division, type: r.divisionType, headcount, attendanceRate, productivity, payroll, avgSalary, absentDays, overtimeHours, trainingHours, turnoverRate };
    });

    const count = byDivision.length;
    return {
      hasAccess: true, period, totalHeadcount, totalPayroll, jasaHeadcount, manufakturHeadcount,
      avgSalary: totalHeadcount > 0 ? Math.round(totalPayroll / totalHeadcount) : 0,
      attendanceRate: count > 0 ? Math.round(totalAttendance / count) : 0,
      productivityScore: count > 0 ? Math.round(totalProductivity / count) : 0,
      totalAbsent, totalOvertime, totalTrainingHours,
      turnoverRate: count > 0 ? Math.round((totalTurnover / count) * 10) / 10 : 0,
      byDivision: byDivision.sort((a, b) => b.headcount - a.headcount),
    };
  },
});

export const getHrTrend = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args): Promise<BodHrTrend> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return { hasAccess: true, periods: [] };

    const months = args.months ?? 6;
    const now = new Date();
    const targetPeriods: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targetPeriods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const results = await Promise.all(
      targetPeriods.map(async (period) => {
        const reports = await ctx.db
          .query("bodKpiReports")
          .withIndex("by_org_period_category", (q) =>
            q.eq("organizationId", orgId).eq("period", period).eq("category", "hr")
          )
          .collect();
        type RawData = { headcount?: number; attendanceRate?: number; productivity?: number; payroll?: number };
        let totalHeadcount = 0, totalAttendance = 0, totalProductivity = 0, totalPayroll = 0;
        for (const r of reports) {
          let data: RawData = {};
          try { data = JSON.parse(r.data) as RawData; } catch { /* ignore */ }
          totalHeadcount += data.headcount ?? 0;
          totalAttendance += data.attendanceRate ?? 0;
          totalProductivity += data.productivity ?? 0;
          totalPayroll += data.payroll ?? 0;
        }
        const count = reports.length;
        return {
          period, totalHeadcount, totalPayroll,
          attendanceRate: count > 0 ? Math.round(totalAttendance / count) : 0,
          productivityScore: count > 0 ? Math.round(totalProductivity / count) : 0,
        };
      })
    );

    return { hasAccess: true, periods: results };
  },
});

export const getProductionSummary = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args): Promise<BodProductionSummary> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    const period = args.period ?? currentPeriod();
    const empty: BodProductionSummary = {
      hasAccess: true, period, activeProjects: 0, onTrackProjects: 0, atRiskProjects: 0,
      delayedProjects: 0, completedProjects: 0, otdRate: 0, avgCapacityUtilization: 0,
      totalOutputVolume: 0, totalPipelineValue: 0, jasaProjects: 0, manufakturProjects: 0,
      byDivision: [],
    };
    if (!orgId) return empty;

    const reports = await ctx.db
      .query("bodKpiReports")
      .withIndex("by_org_period_category", (q) =>
        q.eq("organizationId", orgId).eq("period", period).eq("category", "production")
      )
      .collect();

    let activeProjects = 0, onTrackProjects = 0, atRiskProjects = 0, delayedProjects = 0;
    let completedProjects = 0, totalOtd = 0, totalCapacity = 0, totalOutputVolume = 0;
    let totalPipelineValue = 0, jasaProjects = 0, manufakturProjects = 0;
    type RawData = { projects?: number; onTrack?: number; atRisk?: number; delayed?: number; completed?: number; otd?: number; capacityUtilization?: number; outputVolume?: number; pipelineValue?: number };
    const byDivision = reports.map((r) => {
      let data: RawData = {};
      try { data = JSON.parse(r.data) as RawData; } catch { /* ignore */ }
      const projects = data.projects ?? 0;
      const onTrack = data.onTrack ?? 0;
      const atRisk = data.atRisk ?? 0;
      const delayed = data.delayed ?? 0;
      const completed = data.completed ?? 0;
      const otd = data.otd ?? 0;
      const capacityUtilization = data.capacityUtilization ?? 0;
      const outputVolume = data.outputVolume ?? 0;
      const pipelineValue = data.pipelineValue ?? 0;
      activeProjects += projects;
      onTrackProjects += onTrack;
      atRiskProjects += atRisk;
      delayedProjects += delayed;
      completedProjects += completed;
      totalOtd += otd;
      totalCapacity += capacityUtilization;
      totalOutputVolume += outputVolume;
      totalPipelineValue += pipelineValue;
      if (r.divisionType === "jasa") jasaProjects += projects;
      else manufakturProjects += projects;
      return { division: r.division, type: r.divisionType, projects, onTrack, atRisk, delayed, completed, otd, capacityUtilization, outputVolume, pipelineValue };
    });

    const count = byDivision.length;
    return {
      hasAccess: true, period, activeProjects, onTrackProjects, atRiskProjects, delayedProjects,
      completedProjects, totalOutputVolume, totalPipelineValue, jasaProjects, manufakturProjects,
      otdRate: count > 0 ? Math.round(totalOtd / count) : 0,
      avgCapacityUtilization: count > 0 ? Math.round(totalCapacity / count) : 0,
      byDivision: byDivision.sort((a, b) => b.projects - a.projects),
    };
  },
});

export const getProductionTrend = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args): Promise<BodProductionTrend> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return { hasAccess: true, periods: [] };

    const months = args.months ?? 6;
    const now = new Date();
    const targetPeriods: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targetPeriods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const results = await Promise.all(
      targetPeriods.map(async (period) => {
        const reports = await ctx.db
          .query("bodKpiReports")
          .withIndex("by_org_period_category", (q) =>
            q.eq("organizationId", orgId).eq("period", period).eq("category", "production")
          )
          .collect();
        type RawData = { projects?: number; delayed?: number; otd?: number };
        let activeProjects = 0, delayedProjects = 0, totalOtd = 0;
        for (const r of reports) {
          let data: RawData = {};
          try { data = JSON.parse(r.data) as RawData; } catch { /* ignore */ }
          activeProjects += data.projects ?? 0;
          delayedProjects += data.delayed ?? 0;
          totalOtd += data.otd ?? 0;
        }
        return { period, activeProjects, delayedProjects, otdRate: reports.length > 0 ? Math.round(totalOtd / reports.length) : 0 };
      })
    );

    return { hasAccess: true, periods: results };
  },
});

// ---------------------------------------------------------------------------
// PERIOD LIST (available periods for navigation)
// ---------------------------------------------------------------------------
export const getAvailablePeriods = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return [currentPeriod()];

    const reports = await ctx.db
      .query("bodKpiReports")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    const periods = new Set<string>([currentPeriod()]);
    for (const r of reports) periods.add(r.period);

    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  },
});

// ---------------------------------------------------------------------------
// TAB CONFIG  (customizable labels per tab)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CURRENT USER DEPARTMENT INFO (untuk auto-fill dialog tambah departemen)
// ---------------------------------------------------------------------------

export type CurrentUserDeptInfo = {
  userName: string;
  userJobTitle: string | null;
  departmentName: string | null;
  departmentCode: string | null;   // kode dept dari nama dept (auto-generate)
  isHeadOfDept: boolean;           // apakah user ini kepala departemen tsb
  headName: string | null;         // nama kepala departemen (bisa berbeda dari user)
  role: string | null;             // role user (super_admin, admin, dll)
};

export const getCurrentUserDeptInfo = query({
  args: {},
  handler: async (ctx): Promise<CurrentUserDeptInfo> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { userName: "", userJobTitle: null, departmentName: null, departmentCode: null, isHeadOfDept: false, headName: null, role: null };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return { userName: "", userJobTitle: null, departmentName: null, departmentCode: null, isHeadOfDept: false, headName: null, role: null };

    const deptName = user.department ?? null;
    let isHeadOfDept = false;
    let headName: string | null = user.name ?? null;
    let departmentCode: string | null = null;

    if (deptName) {
      // Cari departemen di tabel departments berdasarkan nama
      const dept = await ctx.db
        .query("departments")
        .withIndex("by_name", (q) => q.eq("name", deptName))
        .first();

      if (dept) {
        // Cek apakah user ini adalah kepala departemen
        isHeadOfDept = dept.headId === user._id;

        if (dept.headId) {
          const head = await ctx.db.get(dept.headId);
          headName = head?.name ?? user.name ?? null;
          if (head?._id === user._id) isHeadOfDept = true;
        }

        // Generate kode dari nama dept: ambil huruf kapital / kata pertama
        const words = deptName.split(/\s+/);
        departmentCode = words
          .slice(0, 3)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("") + "-" + String(dept.order + 1).padStart(2, "0");
      }
    }

    return {
      userName: user.name ?? "",
      userJobTitle: user.jobTitle ?? null,
      departmentName: deptName,
      departmentCode,
      isHeadOfDept,
      headName,
      role: user.role ?? null,
    };
  },
});

// ---------------------------------------------------------------------------
// DIVISION KPI INPUT (Program vs Realisasi per divisi)
// ---------------------------------------------------------------------------

export type DivisionKpiRow = {
  _id: string;
  division: string;
  divisionType: string;
  period: string;
  kpiKey: string;          // e.g. "total_revenue", "gross_profit", ...
  program: number;         // target/program yg diinput divisi
  realisasi: number;       // realisasi aktual
  achievement: number;     // realisasi/program * 100
  prevAchievement: number | null; // achievement periode sebelumnya (untuk panah)
};

export const getDivisionKpiList = query({
  args: { period: v.string(), kpiKey: v.optional(v.string()) },
  handler: async (ctx, args): Promise<DivisionKpiRow[]> => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) return [];

    // Hitung periode sebelumnya
    const [y, m] = args.period.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    const rows = await ctx.db
      .query("bodDivisionKpi")
      .withIndex("by_org_period", (q) => q.eq("organizationId", orgId).eq("period", args.period))
      .collect();

    const prevRows = await ctx.db
      .query("bodDivisionKpi")
      .withIndex("by_org_period", (q) => q.eq("organizationId", orgId).eq("period", prevPeriod))
      .collect();

    const prevMap = new Map(prevRows.map((r) => [`${r.division}__${r.kpiKey}`, r]));

    const filtered = args.kpiKey ? rows.filter((r) => r.kpiKey === args.kpiKey) : rows;

    return filtered.map((r) => {
      const achievement = r.program > 0 ? Math.round((r.realisasi / r.program) * 100) : 0;
      const prev = prevMap.get(`${r.division}__${r.kpiKey}`);
      const prevAchievement = prev && prev.program > 0 ? Math.round((prev.realisasi / prev.program) * 100) : null;
      return {
        _id: r._id,
        division: r.division,
        divisionType: r.divisionType,
        period: r.period,
        kpiKey: r.kpiKey,
        program: r.program,
        realisasi: r.realisasi,
        achievement,
        prevAchievement,
      };
    });
  },
});

export const upsertDivisionKpi = mutation({
  args: {
    division: v.string(),
    divisionType: v.string(),
    period: v.string(),
    kpiKey: v.string(),
    program: v.number(),
    realisasi: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireExec(ctx);
    const orgId = user.organizationId;
    if (!orgId) throw new ConvexError({ code: "FORBIDDEN", message: "No organization" });

    const existing = await ctx.db
      .query("bodDivisionKpi")
      .withIndex("by_org_period_div_kpi", (q) =>
        q.eq("organizationId", orgId)
          .eq("period", args.period)
          .eq("division", args.division)
          .eq("kpiKey", args.kpiKey)
      )
      .unique();

    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, {
        program: args.program,
        realisasi: args.realisasi,
        updatedAt: now,
      });
      return existing._id;
    }
    return ctx.db.insert("bodDivisionKpi", {
      organizationId: orgId,
      division: args.division,
      divisionType: args.divisionType,
      period: args.period,
      kpiKey: args.kpiKey,
      program: args.program,
      realisasi: args.realisasi,
      updatedAt: now,
    });
  },
});

export type BodTabConfigData = {
  tabTitle?: string;         // label on the tab trigger
  kpiLabels?: Record<string, string>;  // kpiKey -> label override
  kpiSubs?: Record<string, string>;    // kpiKey -> sub-label override
  sectionTitles?: Record<string, string>; // sectionKey -> title override
};

export const getTabConfig = query({
  args: { tabKey: v.string() },
  handler: async (ctx, args): Promise<BodTabConfigData> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return {};
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return {};
    const orgId = user.organizationId ?? undefined;
    const row = await ctx.db
      .query("bodTabConfig")
      .withIndex("by_org_and_tab", (q) => q.eq("organizationId", orgId).eq("tabKey", args.tabKey))
      .unique();
    if (!row) return {};
    try { return JSON.parse(row.config) as BodTabConfigData; } catch { return {}; }
  },
});

export const saveTabConfig = mutation({
  args: { tabKey: v.string(), config: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User tidak ditemukan" });

    const orgId = user.organizationId ?? undefined;
    const existing = await ctx.db
      .query("bodTabConfig")
      .withIndex("by_org_and_tab", (q) => q.eq("organizationId", orgId).eq("tabKey", args.tabKey))
      .unique();
    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, { config: args.config, updatedBy: user._id, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("bodTabConfig", {
      organizationId: orgId,
      tabKey: args.tabKey,
      config: args.config,
      updatedBy: user._id,
      updatedAt: now,
    });
  },
});

// ── Daftar nama Lini Bisnis (master list, per organisasi) ─────────────────────
// Disimpan di bodTabConfig dengan tabKey khusus agar konsisten untuk semua
// pengguna (input Keuangan maupun Direksi yang melihat dashboard).
const REVENUE_LINES_TAB_KEY = "revenue_line_names";

export const getRevenueLineNames = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const orgId = user.organizationId ?? undefined;
    const row = await ctx.db
      .query("bodTabConfig")
      .withIndex("by_org_and_tab", (q) => q.eq("organizationId", orgId).eq("tabKey", REVENUE_LINES_TAB_KEY))
      .unique();
    if (!row) return [];
    try {
      const parsed = JSON.parse(row.config) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x): x is string => typeof x === "string");
    } catch {
      return [];
    }
  },
});

export const saveRevenueLineNames = mutation({
  args: { names: v.array(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User tidak ditemukan" });

    // Bersihkan: trim, buang kosong, buang duplikat (case-insensitive), pertahankan urutan
    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const raw of args.names) {
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push(name);
    }

    const orgId = user.organizationId ?? undefined;
    const existing = await ctx.db
      .query("bodTabConfig")
      .withIndex("by_org_and_tab", (q) => q.eq("organizationId", orgId).eq("tabKey", REVENUE_LINES_TAB_KEY))
      .unique();
    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, { config: JSON.stringify(cleaned), updatedBy: user._id, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("bodTabConfig", {
      organizationId: orgId,
      tabKey: REVENUE_LINES_TAB_KEY,
      config: JSON.stringify(cleaned),
      updatedBy: user._id,
      updatedAt: now,
    });
  },
});

// ── Finance Reports ───────────────────────────────────────────────────────────

export type KpiPR = { program: number; realisasi: number };

export type RevenueLine = { name: string; program: number; realisasi: number };

export type FinanceReportData = {
  totalRevenue:      KpiPR;  // Total Revenue (program = budget)
  grossProfit:       KpiPR;  // Gross Profit
  ebitda:            KpiPR;  // EBITDA
  cashFlow:          KpiPR;  // Cash Flow
  ar:                KpiPR;  // Accounts Receivable
  ap:                KpiPR;  // Accounts Payable
  totalCost:         KpiPR;  // Total Biaya
  netProfit:         KpiPR;  // Laba Bersih (Net Profit)
  // Pendapatan dipecah per lini bisnis (daftar kecil, opsional)
  revenueByLine?:    RevenueLine[];
};

// ---------------------------------------------------------------------------
// HELPERS — Agregasi periode (triwulan / semester / tahun)
// ---------------------------------------------------------------------------

/**
 * Kembalikan daftar bulan (YYYY-MM) yang tercakup dalam suatu periode.
 * tanggal  → kembalikan bulan dari tanggal tersebut
 * bulan    → [bulan itu]
 * triwulan → [3 bulan]
 * semester → [6 bulan]
 * tahun    → [12 bulan]
 */
export function monthsForPeriod(period: string): string[] {
  // Tanggal: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return [period.slice(0, 7)];
  // Bulan: YYYY-MM
  if (/^\d{4}-\d{2}$/.test(period)) return [period];
  // Triwulan: YYYY-Q1..Q4
  const qm = period.match(/^(\d{4})-Q([1-4])$/);
  if (qm) {
    const y = qm[1];
    const q = parseInt(qm[2]);
    const start = (q - 1) * 3 + 1;
    return Array.from({ length: 3 }, (_, i) => `${y}-${String(start + i).padStart(2, "0")}`);
  }
  // Semester: YYYY-S1|S2
  const sm = period.match(/^(\d{4})-S([12])$/);
  if (sm) {
    const y = sm[1];
    const start = sm[2] === "1" ? 1 : 7;
    return Array.from({ length: 6 }, (_, i) => `${y}-${String(start + i).padStart(2, "0")}`);
  }
  // Tahun: YYYY
  if (/^\d{4}$/.test(period)) {
    const y = period;
    return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, "0")}`);
  }
  return [];
}

/**
 * Agregasi financeReports dari bulan-bulan yang tercakup dalam suatu periode.
 * Digunakan saat tidak ada laporan langsung untuk periode triwulan/semester/tahun.
 */
async function aggregateMonthsForPeriod(
  ctx: QueryCtx,
  orgId: Id<"organizations"> | undefined,
  period: string,
): Promise<FinanceReportData | null> {
  const months = monthsForPeriod(period);
  if (months.length <= 1) return null; // bulan/tanggal tidak perlu agregasi

  const rows: FinanceReportData[] = [];
  for (const m of months) {
    const row = orgId
      ? await ctx.db.query("financeReports")
          .withIndex("by_org_period", (q) => q.eq("organizationId", orgId).eq("period", m))
          .unique()
      : await ctx.db.query("financeReports")
          .withIndex("by_org_period", (q) => q.eq("organizationId", undefined).eq("period", m))
          .unique();
    if (row && row.status === "final") rows.push(normalizeFinanceData(row.data));
  }
  if (rows.length === 0) return null;

  // Sum semua realisasi; untuk program ambil sum program bulan yang ada
  const sum = (fn: (r: FinanceReportData) => number) => rows.reduce((acc, r) => acc + fn(r), 0);

  // Gabung pendapatan per lini bisnis lintas bulan (jumlahkan berdasarkan nama)
  const lineMap = new Map<string, { program: number; realisasi: number }>();
  for (const r of rows) {
    for (const l of r.revenueByLine ?? []) {
      const entry = lineMap.get(l.name) ?? { program: 0, realisasi: 0 };
      entry.program += l.program;
      entry.realisasi += l.realisasi;
      lineMap.set(l.name, entry);
    }
  }
  const revenueByLine: RevenueLine[] = Array.from(lineMap.entries())
    .map(([name, v]) => ({ name, program: v.program, realisasi: v.realisasi }));

  return {
    totalRevenue: { realisasi: sum((r) => r.totalRevenue.realisasi), program: sum((r) => r.totalRevenue.program) },
    totalCost:    { realisasi: sum((r) => r.totalCost.realisasi),    program: sum((r) => r.totalCost.program) },
    grossProfit:  { realisasi: sum((r) => r.grossProfit.realisasi),  program: sum((r) => r.grossProfit.program) },
    ebitda:       { realisasi: sum((r) => r.ebitda.realisasi),       program: sum((r) => r.ebitda.program) },
    netProfit:    { realisasi: sum((r) => r.netProfit.realisasi),    program: sum((r) => r.netProfit.program) },
    cashFlow:     { realisasi: sum((r) => r.cashFlow.realisasi),     program: sum((r) => r.cashFlow.program) },
    ar:           { realisasi: sum((r) => r.ar.realisasi),           program: sum((r) => r.ar.program) },
    ap:           { realisasi: sum((r) => r.ap.realisasi),           program: sum((r) => r.ap.program) },
    ...(revenueByLine.length > 0 ? { revenueByLine } : {}),
  };
}

/**
 * Parse blob JSON financeReports menjadi FinanceReportData baru.
 * Data lama disimpan sebagai angka flat (mis. `totalRevenue: 5000`) —
 * ditangani dengan menganggap angka tersebut sebagai realisasi & program 0.
 * Field `totalBudget` lama menjadi program dari totalRevenue.
 */
export function normalizeFinanceData(raw: string): FinanceReportData {
  let parsed: unknown = {};
  try { parsed = JSON.parse(raw); } catch { /* ignore */ }
  const obj = (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>) : {};

  const toPR = (val: unknown): KpiPR => {
    if (val && typeof val === "object") {
      const o = val as Record<string, unknown>;
      const program = typeof o.program === "number" ? o.program : 0;
      const realisasi = typeof o.realisasi === "number" ? o.realisasi : 0;
      return { program, realisasi };
    }
    // Format lama: angka flat → treat as realisasi, program 0
    if (typeof val === "number") return { program: 0, realisasi: val };
    return { program: 0, realisasi: 0 };
  };

  const totalRevenue = toPR(obj.totalRevenue);
  // Backward compat: totalBudget lama = program dari totalRevenue
  if (totalRevenue.program === 0 && typeof obj.totalBudget === "number") {
    totalRevenue.program = obj.totalBudget;
  }

  return {
    totalRevenue,
    grossProfit:       toPR(obj.grossProfit),
    ebitda:            toPR(obj.ebitda),
    cashFlow:          toPR(obj.cashFlow),
    ar:                toPR(obj.ar),
    ap:                toPR(obj.ap),
    // backward compat: jika totalCost ada pakai itu, jika tidak → kembalikan 0
    totalCost: (() => {
      if (obj.totalCost) return toPR(obj.totalCost);
      return { program: 0, realisasi: 0 };
    })(),
    // backward compat: jika netProfit ada pakai itu, jika tidak → kembalikan 0
    netProfit: (() => {
      if (obj.netProfit) return toPR(obj.netProfit);
      return { program: 0, realisasi: 0 };
    })(),
    // Pendapatan per lini bisnis (opsional) — validasi tiap entri
    revenueByLine: (() => {
      if (!Array.isArray(obj.revenueByLine)) return undefined;
      const lines: RevenueLine[] = [];
      for (const item of obj.revenueByLine) {
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const name = typeof o.name === "string" ? o.name.trim() : "";
          if (!name) continue;
          lines.push({
            name,
            program: typeof o.program === "number" ? o.program : 0,
            realisasi: typeof o.realisasi === "number" ? o.realisasi : 0,
          });
        }
      }
      return lines.length > 0 ? lines : undefined;
    })(),
  };
}

export type FinanceReportRow = {
  _id: string;
  period: string;
  periodType: string;
  data: FinanceReportData;
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
  note?: string;
  status: string;
};

/** List laporan keuangan — diurutkan terbaru di atas */
export const listFinanceReports = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<FinanceReportRow[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const orgId = user.organizationId ?? undefined;
    const rows = await ctx.db
      .query("financeReports")
      .withIndex("by_org_submittedAt", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .take(args.limit ?? 50);
    return rows.map((r) => ({
      _id: r._id,
      period: r.period,
      periodType: r.periodType,
      data: normalizeFinanceData(r.data),
      submittedBy: r.submittedBy,
      submittedAt: r.submittedAt,
      updatedAt: r.updatedAt,
      note: r.note,
      status: r.status,
    }));
  },
});

/** Ambil satu laporan berdasarkan periode */
export const getFinanceReportByPeriod = query({
  args: { period: v.string() },
  handler: async (ctx, args): Promise<FinanceReportRow | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    const orgId = user.organizationId ?? undefined;
    const row = await ctx.db
      .query("financeReports")
      .withIndex("by_org_period", (q) => q.eq("organizationId", orgId).eq("period", args.period))
      .unique();
    if (!row) return null;
    return {
      _id: row._id,
      period: row.period,
      periodType: row.periodType,
      data: normalizeFinanceData(row.data),
      submittedBy: row.submittedBy,
      submittedAt: row.submittedAt,
      updatedAt: row.updatedAt,
      note: row.note,
      status: row.status,
    };
  },
});

/**
 * Hapus semua data tanggal (YYYY-MM-DD) milik bulan tertentu.
 * Dipanggil saat laporan bulan dengan status "final" disimpan,
 * karena data harian sudah tidak diperlukan.
 */
async function deleteDailyReportsForMonth(
  ctx: MutationCtx,
  orgId: Id<"organizations"> | undefined,
  monthPeriod: string,
): Promise<void> {
  // Cari semua financeReports yang periodenya YYYY-MM-DD dalam bulan tersebut.
  // Index by_org_period tidak cocok untuk range tanggal, kita scan by_org_submittedAt.
  // Lebih aman: ambil semua dalam org lalu filter by period prefix.
  const rows = orgId
    ? await ctx.db.query("financeReports")
        .withIndex("by_org_submittedAt", (q) => q.eq("organizationId", orgId))
        .collect()
    : await ctx.db.query("financeReports")
        .withIndex("by_org_submittedAt", (q) => q.eq("organizationId", undefined))
        .collect();

  for (const row of rows) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(row.period) && row.period.startsWith(monthPeriod)) {
      await ctx.db.delete(row._id);
    }
  }
}

/** Simpan atau perbarui laporan keuangan (upsert by period) */
export const upsertFinanceReport = mutation({
  args: {
    period: v.string(),
    periodType: v.string(),
    data: v.string(), // JSON blob FinanceReportData
    note: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User tidak ditemukan" });
    const orgId = user.organizationId ?? undefined;
    const now = new Date().toISOString();

    // ── Validasi: tanggal hanya boleh bulan berjalan ──
    if (/^\d{4}-\d{2}-\d{2}$/.test(args.period)) {
      const nowUtc = new Date();
      const currentYM = `${nowUtc.getUTCFullYear()}-${String(nowUtc.getUTCMonth() + 1).padStart(2, "0")}`;
      const inputYM = args.period.slice(0, 7);
      if (inputYM !== currentYM) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: `Data tanggal hanya boleh diinput untuk bulan berjalan (${currentYM}). Tanggal di bulan lain tidak diizinkan.`,
        });
      }
    }

    const existing = await ctx.db
      .query("financeReports")
      .withIndex("by_org_period", (q) => q.eq("organizationId", orgId).eq("period", args.period))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        periodType: args.periodType,
        note: args.note,
        status: args.status,
        updatedAt: now,
        submittedBy: user._id,
      });

      // ── Auto-delete data tanggal saat laporan bulan final disimpan ──
      if (/^\d{4}-\d{2}$/.test(args.period) && args.status === "final") {
        await deleteDailyReportsForMonth(ctx, orgId, args.period);
      }

      return existing._id;
    }
    const id = await ctx.db.insert("financeReports", {
      organizationId: orgId,
      period: args.period,
      periodType: args.periodType,
      data: args.data,
      note: args.note,
      status: args.status,
      submittedBy: user._id,
      submittedAt: now,
      updatedAt: now,
    });

    // ── Auto-delete data tanggal saat laporan bulan baru langsung final ──
    if (/^\d{4}-\d{2}$/.test(args.period) && args.status === "final") {
      await deleteDailyReportsForMonth(ctx, orgId, args.period);
    }

    return id;
  },
});

/** Hapus laporan */
export const deleteFinanceReport = mutation({
  args: { id: v.id("financeReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu" });
    await ctx.db.delete(args.id);
  },
});
