import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel.d.ts";
import { canManageFinance, isAdminRole } from "../roles";
import { requireTenant } from "../lib/tenant";

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

/**
 * Anyone who can manage finance (super_admin, admin, treasurer) can
 * administer the payroll module.
 */
export async function requirePayrollAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!canManageFinance(user.role)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Hanya admin/bendahara yang dapat mengelola payroll",
    });
  }
  return user;
}

export function canManagePayroll(
  role: string | undefined | null,
): boolean {
  return canManageFinance(role);
}

export { isAdminRole };

// Compute a single payslip's earnings and deductions for the given user
// based on either override salary components or default catalog values.
export type PayslipLineInput = {
  componentId: Id<"payrollComponents">;
  name: string;
  code: string;
  type: "earning" | "deduction";
  amount: number;
  order: number;
};

export async function computeUserPayslipLines(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Array<PayslipLineInput>> {
  // Load active components
  const activeComponents = await ctx.db
    .query("payrollComponents")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();
  // Pull overrides for this user
  const overrides = await ctx.db
    .query("employeeSalaryComponents")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const overrideMap = new Map<Id<"payrollComponents">, number>();
  for (const o of overrides) {
    overrideMap.set(o.componentId, o.amount);
  }

  // First pass: compute base earnings (fixed only) to derive basic salary
  // assumption for percent_of_basic: the "BASIC" code component amount
  // (or first fixed earning if no explicit BASIC)
  let basic = 0;
  for (const c of activeComponents) {
    if (c.type !== "earning") continue;
    if (c.calculation !== "fixed") continue;
    const amount = overrideMap.get(c._id) ?? c.defaultAmount;
    if (c.code.toUpperCase() === "BASIC" || basic === 0) {
      basic = amount;
      if (c.code.toUpperCase() === "BASIC") break;
    }
  }

  const lines: Array<PayslipLineInput> = [];
  const sorted = [...activeComponents].sort((a, b) => a.order - b.order);
  for (const c of sorted) {
    const type = c.type === "deduction" ? "deduction" : "earning";
    let amount: number;
    if (c.calculation === "percent_of_basic") {
      const pct = overrideMap.get(c._id) ?? c.defaultAmount;
      amount = Math.round((basic * pct) / 100);
    } else {
      amount = Math.round(overrideMap.get(c._id) ?? c.defaultAmount);
    }
    lines.push({
      componentId: c._id,
      name: c.name,
      code: c.code,
      type,
      amount,
      order: c.order,
    });
  }
  return lines;
}

export function totalsFromLines(lines: Array<PayslipLineInput>): {
  totalEarnings: number;
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;
  basicSalary: number;
} {
  let totalEarnings = 0;
  let totalDeductions = 0;
  let basic = 0;
  for (const l of lines) {
    if (l.type === "earning") {
      totalEarnings += l.amount;
      if (l.code.toUpperCase() === "BASIC" && basic === 0) {
        basic = l.amount;
      }
    } else {
      totalDeductions += l.amount;
    }
  }
  // Fallback: if no BASIC component, use first earning as basic salary
  if (basic === 0) {
    const firstEarning = lines.find((l) => l.type === "earning");
    basic = firstEarning?.amount ?? 0;
  }
  const grossSalary = totalEarnings;
  const netSalary = totalEarnings - totalDeductions;
  return {
    totalEarnings,
    totalDeductions,
    grossSalary,
    netSalary,
    basicSalary: basic,
  };
}
