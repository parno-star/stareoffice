import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel.d.ts";
import { canManageTeam, isAdminRole } from "../roles";
import { requireTenant } from "../lib/tenant";

export const OKR_SCOPES = [
  "company",
  "department",
  "team",
  "individual",
] as const;

export const OKR_OBJECTIVE_STATUSES = [
  "draft",
  "active",
  "completed",
  "archived",
] as const;

export const OKR_HEALTH = [
  "on_track",
  "at_risk",
  "off_track",
  "achieved",
] as const;

export const OKR_CATEGORIES = [
  "strategic",
  "growth",
  "product",
  "customer",
  "people",
  "ops",
  "finance",
  "other",
] as const;

export const KR_METRIC_TYPES = [
  "number",
  "percent",
  "currency",
  "boolean",
  "milestone",
] as const;

export const KR_DIRECTIONS = ["higher_is_better", "lower_is_better"] as const;

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const { userId } = await requireTenant(ctx, { allowSuperAdmin: true });
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  }
  return user;
}

/** Admin or supervisor can manage company/department/team-level objectives. */
export async function requireOkrManager(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!canManageTeam(user.role)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Hanya admin/supervisor yang dapat mengelola OKR ini",
    });
  }
  return user;
}

/**
 * Return whether the current user may edit the given objective.
 * Admin = always; owner = always; supervisor for team/department matching
 * their span = yes.
 */
export function canEditObjective(
  user: Doc<"users">,
  objective: Doc<"objectives">,
): boolean {
  if (isAdminRole(user.role)) return true;
  if (objective.ownerId === user._id) return true;
  if (objective.authorId === user._id) return true;
  return false;
}

/**
 * Return whether the user may update a key result (check-in).
 * KR owner, objective owner, or admin can.
 */
export function canUpdateKeyResult(
  user: Doc<"users">,
  kr: Doc<"keyResults">,
  objective: Doc<"objectives">,
): boolean {
  if (isAdminRole(user.role)) return true;
  if (kr.ownerId === user._id) return true;
  if (objective.ownerId === user._id) return true;
  return false;
}

/** Compute progress percent (0..100) for a key result. */
export function computeKrProgress(kr: {
  startValue: number;
  targetValue: number;
  currentValue: number;
  direction: string;
}): number {
  const { startValue, targetValue, currentValue, direction } = kr;
  if (targetValue === startValue) {
    return currentValue >= targetValue ? 100 : 0;
  }
  let pct: number;
  if (direction === "lower_is_better") {
    // progress when current moves from start (higher) towards target (lower)
    pct =
      ((startValue - currentValue) / (startValue - targetValue)) * 100;
  } else {
    pct = ((currentValue - startValue) / (targetValue - startValue)) * 100;
  }
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Infer status from progress & confidence. */
export function deriveKrStatus(progress: number, confidence: number): string {
  if (progress >= 100) return "achieved";
  if (progress >= 70 && confidence >= 60) return "on_track";
  if (progress >= 40 || confidence >= 40) return "at_risk";
  return "off_track";
}

/** Recompute objective aggregate progress & health from its key results. */
export async function recomputeObjective(
  ctx: MutationCtx,
  objectiveId: Id<"objectives">,
): Promise<void> {
  const krs = await ctx.db
    .query("keyResults")
    .withIndex("by_objective", (q) => q.eq("objectiveId", objectiveId))
    .collect();
  const objective = await ctx.db.get(objectiveId);
  if (!objective) return;

  let totalWeight = 0;
  let weightedProgress = 0;
  let offTrack = 0;
  let atRisk = 0;
  let achieved = 0;
  for (const kr of krs) {
    const w = kr.weight || 1;
    totalWeight += w;
    weightedProgress += kr.progress * w;
    if (kr.status === "off_track") offTrack += 1;
    else if (kr.status === "at_risk") atRisk += 1;
    else if (kr.status === "achieved") achieved += 1;
  }
  const progress = totalWeight > 0 ? weightedProgress / totalWeight : 0;
  let health = "on_track";
  if (krs.length === 0) {
    health = "on_track";
  } else if (achieved === krs.length) {
    health = "achieved";
  } else if (offTrack > 0) {
    health = "off_track";
  } else if (atRisk > 0) {
    health = "at_risk";
  }
  await ctx.db.patch(objectiveId, {
    progress: Math.round(progress),
    health,
    keyResultCount: krs.length,
    lastUpdatedAt: new Date().toISOString(),
  });
}

export function formatPeriodLabel(period: string): string {
  // "2026" -> "2026"
  // "2026-Q1" -> "Q1 2026"
  // "2026-H1" -> "H1 2026"
  // "2026-04" -> "April 2026" (month)
  const parts = period.split("-");
  if (parts.length === 1) return parts[0];
  const year = parts[0];
  const second = parts[1];
  if (/^Q[1-4]$/.test(second)) return `${second} ${year}`;
  if (/^H[12]$/.test(second)) return `${second} ${year}`;
  if (/^\d{1,2}$/.test(second)) {
    const monthIdx = Math.max(0, Math.min(11, parseInt(second, 10) - 1));
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${months[monthIdx]} ${year}`;
  }
  return period;
}
