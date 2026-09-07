import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";
import { isExecutiveRole, canManageStrategicIssues } from "./roles";
import { requireTenant } from "./lib/tenant";

// ---------------------------------------------------------------------------
// Strategic Issues board (Papan Isu Strategis)
//
// Board-level issues / urgent priorities surfaced for director attention.
// Executives (admin, department_head, hr_manager) manage (CRUD); directors
// monitor (read-only). Everything is tenant-scoped by organizationId.
// ---------------------------------------------------------------------------

const URGENCY_VALUES = ["low", "medium", "high", "critical"] as const;
const IMPACT_VALUES = ["low", "medium", "high"] as const;
const STATUS_VALUES = [
  "needs_decision",
  "in_progress",
  "monitoring",
  "resolved",
] as const;

export type StrategicIssueRow = {
  _id: Id<"strategicIssues">;
  title: string;
  description: string | null;
  ownerId: Id<"users">;
  ownerName: string | null;
  department: string | null;
  urgency: string;
  impact: string;
  dueDate: string | null;
  status: string;
  linkedObjectiveId: Id<"objectives"> | null;
  linkedObjectiveTitle: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type StrategicIssuesBoard = {
  hasAccess: boolean;
  canManage: boolean;
  issues: Array<StrategicIssueRow>;
  counts: {
    needsDecision: number;
    inProgress: number;
    monitoring: number;
    resolved: number;
    overdue: number;
  };
};

async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const { userId } = await requireTenant(ctx, { allowSuperAdmin: true });
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  }
  return user;
}

// Sort by decision urgency first: open issues before resolved, then by urgency
// rank, then by nearest due date.
const STATUS_ORDER: Record<string, number> = {
  needs_decision: 0,
  in_progress: 1,
  monitoring: 2,
  resolved: 3,
};
const URGENCY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const listIssues = query({
  args: {},
  handler: async (ctx): Promise<StrategicIssuesBoard> => {
    const user = await getCurrentUser(ctx);

    const emptyBoard: StrategicIssuesBoard = {
      hasAccess: false,
      canManage: false,
      issues: [],
      counts: {
        needsDecision: 0,
        inProgress: 0,
        monitoring: 0,
        resolved: 0,
        overdue: 0,
      },
    };

    if (user.role === "super_admin") {
      // Super admin has full unrestricted access
    } else if (!isExecutiveRole(user.role)) {
      return emptyBoard;
    }

    const canManage = user.role === "super_admin" || canManageStrategicIssues(user.role);
    let orgId = user.organizationId ?? null;
    if (!orgId && user.role === "super_admin") {
      const firstOrg = await ctx.db.query("organizations").first();
      orgId = firstOrg?._id ?? null;
    }
    if (!orgId) {
      return { ...emptyBoard, hasAccess: true, canManage: true };
    }

    const rows = await ctx.db
      .query("strategicIssues")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    // Resolve owner names.
    const ownerIds = Array.from(new Set(rows.map((r) => r.ownerId)));
    const owners = await Promise.all(ownerIds.map((id) => ctx.db.get(id)));
    const ownerNameById = new Map<Id<"users">, string>();
    for (const o of owners) {
      if (o) ownerNameById.set(o._id, o.name ?? "Tanpa nama");
    }

    // Resolve linked objective titles.
    const objectiveIds = Array.from(
      new Set(
        rows
          .map((r) => r.linkedObjectiveId)
          .filter((id): id is Id<"objectives"> => id !== undefined),
      ),
    );
    const objectives = await Promise.all(
      objectiveIds.map((id) => ctx.db.get(id)),
    );
    const objectiveTitleById = new Map<Id<"objectives">, string>();
    for (const o of objectives) {
      if (o) objectiveTitleById.set(o._id, o.title);
    }

    const nowIso = new Date().toISOString();

    const issues: Array<StrategicIssueRow> = rows.map((r) => ({
      _id: r._id,
      title: r.title,
      description: r.description ?? null,
      ownerId: r.ownerId,
      ownerName: ownerNameById.get(r.ownerId) ?? null,
      department: r.department ?? null,
      urgency: r.urgency,
      impact: r.impact,
      dueDate: r.dueDate ?? null,
      status: r.status,
      linkedObjectiveId: r.linkedObjectiveId ?? null,
      linkedObjectiveTitle: r.linkedObjectiveId
        ? (objectiveTitleById.get(r.linkedObjectiveId) ?? null)
        : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      resolvedAt: r.resolvedAt ?? null,
    }));

    issues.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 9;
      const sb = STATUS_ORDER[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      const ua = URGENCY_ORDER[a.urgency] ?? 9;
      const ub = URGENCY_ORDER[b.urgency] ?? 9;
      if (ua !== ub) return ua - ub;
      // Nearest due date first; issues without a due date sink to the bottom.
      const da = a.dueDate ?? "9999";
      const db = b.dueDate ?? "9999";
      return da.localeCompare(db);
    });

    const counts = {
      needsDecision: rows.filter((r) => r.status === "needs_decision").length,
      inProgress: rows.filter((r) => r.status === "in_progress").length,
      monitoring: rows.filter((r) => r.status === "monitoring").length,
      resolved: rows.filter((r) => r.status === "resolved").length,
      overdue: rows.filter(
        (r) =>
          r.status !== "resolved" && !!r.dueDate && r.dueDate < nowIso,
      ).length,
    };

    return { hasAccess: true, canManage, issues, counts };
  },
});

// Options for the create/edit form: employees (potential owners) and active
// objectives to optionally link.
export type IssueFormOptions = {
  owners: Array<{ _id: Id<"users">; name: string; department: string | null }>;
  departments: Array<string>;
  objectives: Array<{ _id: Id<"objectives">; title: string; period: string }>;
};

export const getFormOptions = query({
  args: {},
  handler: async (ctx): Promise<IssueFormOptions> => {
    const user = await getCurrentUser(ctx);
    if (!canManageStrategicIssues(user.role)) {
      return { owners: [], departments: [], objectives: [] };
    }
    const orgId = user.organizationId ?? null;
    if (!orgId) return { owners: [], departments: [], objectives: [] };

    const [users, departments, objectives] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("departments")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("objectives")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
    ]);

    const owners = users
      .map((u) => ({
        _id: u._id,
        name: u.name ?? "Tanpa nama",
        department: u.department ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const departmentNames = departments
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));

    const objectiveOptions = objectives
      .filter((o) => o.status !== "archived")
      .map((o) => ({ _id: o._id, title: o.title, period: o.period }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      owners,
      departments: departmentNames,
      objectives: objectiveOptions,
    };
  },
});

// Validate that a referenced document belongs to the caller's organization.
async function assertOwnerInOrg(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<void> {
  const owner = await ctx.db.get(ownerId);
  if (!owner || (owner.organizationId && owner.organizationId !== orgId)) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "PIC tidak valid untuk organisasi ini.",
    });
  }
}

async function assertObjectiveInOrg(
  ctx: MutationCtx,
  objectiveId: Id<"objectives">,
  orgId: Id<"organizations">,
): Promise<void> {
  const obj = await ctx.db.get(objectiveId);
  if (!obj || (obj.organizationId && obj.organizationId !== orgId)) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Objektif tertaut tidak valid untuk organisasi ini.",
    });
  }
}

function requireManager(user: Doc<"users">): void {
  if (user.role === "super_admin") return;
  if (!canManageStrategicIssues(user.role)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Anda tidak memiliki izin untuk mengelola isu strategis.",
    });
  }
}

const issueInputArgs = {
  title: v.string(),
  description: v.optional(v.string()),
  ownerId: v.id("users"),
  department: v.optional(v.string()),
  urgency: v.union(...URGENCY_VALUES.map((u) => v.literal(u))),
  impact: v.union(...IMPACT_VALUES.map((i) => v.literal(i))),
  dueDate: v.optional(v.string()),
  status: v.union(...STATUS_VALUES.map((s) => v.literal(s))),
  linkedObjectiveId: v.optional(v.id("objectives")),
};

export const createIssue = mutation({
  args: issueInputArgs,
  handler: async (ctx, args): Promise<Id<"strategicIssues">> => {
    const { organizationId } = await requireTenant(ctx, {
      allowSuperAdmin: true,
    });
    const user = await getCurrentUser(ctx);
    requireManager(user);

    if (!organizationId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Pilih organisasi terlebih dahulu untuk membuat isu.",
      });
    }

    const title = args.title.trim();
    if (title.length === 0) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Judul isu tidak boleh kosong.",
      });
    }

    await assertOwnerInOrg(ctx, args.ownerId, organizationId);
    if (args.linkedObjectiveId) {
      await assertObjectiveInOrg(ctx, args.linkedObjectiveId, organizationId);
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("strategicIssues", {
      title,
      description: args.description?.trim() || undefined,
      ownerId: args.ownerId,
      department: args.department || undefined,
      urgency: args.urgency,
      impact: args.impact,
      dueDate: args.dueDate || undefined,
      status: args.status,
      linkedObjectiveId: args.linkedObjectiveId,
      authorId: user._id,
      createdAt: now,
      updatedAt: now,
      resolvedAt: args.status === "resolved" ? now : undefined,
      organizationId,
    });
  },
});

export const updateIssue = mutation({
  args: { issueId: v.id("strategicIssues"), ...issueInputArgs },
  handler: async (ctx, args): Promise<null> => {
    const { organizationId } = await requireTenant(ctx, {
      allowSuperAdmin: true,
    });
    const user = await getCurrentUser(ctx);
    requireManager(user);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Isu tidak ditemukan." });
    }
    // Tenant isolation.
    if (
      issue.organizationId &&
      organizationId &&
      issue.organizationId !== organizationId
    ) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki akses ke isu ini.",
      });
    }

    const title = args.title.trim();
    if (title.length === 0) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Judul isu tidak boleh kosong.",
      });
    }

    const effectiveOrg = issue.organizationId ?? organizationId;
    if (effectiveOrg) {
      await assertOwnerInOrg(ctx, args.ownerId, effectiveOrg);
      if (args.linkedObjectiveId) {
        await assertObjectiveInOrg(ctx, args.linkedObjectiveId, effectiveOrg);
      }
    }

    const now = new Date().toISOString();
    // Preserve the original resolvedAt when it was already resolved; set it the
    // moment it transitions to resolved; clear it when reopened.
    const resolvedAt =
      args.status === "resolved"
        ? (issue.resolvedAt ?? now)
        : undefined;

    await ctx.db.patch(args.issueId, {
      title,
      description: args.description?.trim() || undefined,
      ownerId: args.ownerId,
      department: args.department || undefined,
      urgency: args.urgency,
      impact: args.impact,
      dueDate: args.dueDate || undefined,
      status: args.status,
      linkedObjectiveId: args.linkedObjectiveId,
      updatedAt: now,
      resolvedAt,
    });
    return null;
  },
});

// Lightweight status change used by inline status controls.
export const setStatus = mutation({
  args: {
    issueId: v.id("strategicIssues"),
    status: v.union(...STATUS_VALUES.map((s) => v.literal(s))),
  },
  handler: async (ctx, args): Promise<null> => {
    const { organizationId } = await requireTenant(ctx, {
      allowSuperAdmin: true,
    });
    const user = await getCurrentUser(ctx);
    requireManager(user);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Isu tidak ditemukan." });
    }
    if (
      issue.organizationId &&
      organizationId &&
      issue.organizationId !== organizationId
    ) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki akses ke isu ini.",
      });
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.issueId, {
      status: args.status,
      updatedAt: now,
      resolvedAt:
        args.status === "resolved" ? (issue.resolvedAt ?? now) : undefined,
    });
    return null;
  },
});

export const deleteIssue = mutation({
  args: { issueId: v.id("strategicIssues") },
  handler: async (ctx, args): Promise<null> => {
    const { organizationId } = await requireTenant(ctx, {
      allowSuperAdmin: true,
    });
    const user = await getCurrentUser(ctx);
    requireManager(user);

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Isu tidak ditemukan." });
    }
    if (
      issue.organizationId &&
      organizationId &&
      issue.organizationId !== organizationId
    ) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki akses ke isu ini.",
      });
    }

    await ctx.db.delete(args.issueId);
    return null;
  },
});
