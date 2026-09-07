import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel.d.ts";
import { isAdminRole } from "../roles";
import { requireTenant } from "../lib/tenant";
import { getOrgScope } from "./_scope";

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<Array<Doc<"employeeSkills">>> => {
    await requireTenant(ctx, { allowSuperAdmin: true });
    const rows = await ctx.db
      .query("employeeSkills")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    rows.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return b.level - a.level;
    });
    return rows;
  },
});

export const getMatrix = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    skills: Array<{
      skill: string;
      category: string;
      avgLevel: number;
      holders: number;
    }>;
    topSkilledUsers: Array<{
      userId: Id<"users">;
      name: string;
      skillCount: number;
      avgLevel: number;
    }>;
  }> => {
    const { userIds, isMember } = await getOrgScope(ctx);
    const allRows = await ctx.db.query("employeeSkills").collect();
    // Scope skill rows to employees in the viewing organization.
    const rows =
      userIds === null ? allRows : allRows.filter((r) => isMember(r.userId));
    const users = await ctx.db.query("users").collect();
    const userById = new Map<Id<"users">, Doc<"users">>();
    for (const u of users) userById.set(u._id, u);

    const skillMap = new Map<
      string,
      { skill: string; category: string; total: number; holders: number }
    >();
    const userAgg = new Map<Id<"users">, { total: number; count: number }>();

    for (const r of rows) {
      const key = `${r.skill}__${r.category}`;
      const existing = skillMap.get(key);
      if (existing) {
        existing.total += r.level;
        existing.holders += 1;
      } else {
        skillMap.set(key, {
          skill: r.skill,
          category: r.category,
          total: r.level,
          holders: 1,
        });
      }
      const ua = userAgg.get(r.userId) ?? { total: 0, count: 0 };
      ua.total += r.level;
      ua.count += 1;
      userAgg.set(r.userId, ua);
    }

    const skills = Array.from(skillMap.values())
      .map((s) => ({
        skill: s.skill,
        category: s.category,
        avgLevel: Math.round((s.total / s.holders) * 10) / 10,
        holders: s.holders,
      }))
      .sort((a, b) => b.holders - a.holders);

    const topSkilledUsers = Array.from(userAgg.entries())
      .map(([uid, agg]) => {
        const u = userById.get(uid);
        return {
          userId: uid,
          name: u?.name ?? "Tanpa Nama",
          skillCount: agg.count,
          avgLevel: Math.round((agg.total / agg.count) * 10) / 10,
        };
      })
      .sort((a, b) => b.skillCount - a.skillCount || b.avgLevel - a.avgLevel)
      .slice(0, 8);

    return { skills, topSkilledUsers };
  },
});

export const addSkill = mutation({
  args: {
    userId: v.id("users"),
    skill: v.string(),
    category: v.string(),
    level: v.number(),
    yearsExperience: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"employeeSkills">> => {
    const { userId } = await requireTenant(ctx, { allowSuperAdmin: true });
    const me = await ctx.db.get(userId);
    if (!me) {
      throw new ConvexError({ code: "NOT_FOUND", message: "User tidak ditemukan" });
    }
    // Admins or self can add skills
    if (me._id !== args.userId && !isAdminRole(me.role)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hanya pemilik atau admin yang boleh mengisi keahlian",
      });
    }
    if (args.level < 1 || args.level > 5) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Level harus antara 1 dan 5",
      });
    }
    const trimmed = args.skill.trim();
    if (trimmed.length === 0) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Nama keahlian tidak boleh kosong",
      });
    }
    return await ctx.db.insert("employeeSkills", {
      userId: args.userId,
      skill: trimmed,
      category: args.category,
      level: args.level,
      yearsExperience: args.yearsExperience,
      note: args.note,
    });
  },
});

export const updateSkill = mutation({
  args: {
    skillId: v.id("employeeSkills"),
    level: v.optional(v.number()),
    yearsExperience: v.optional(v.number()),
    note: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<null> => {
    const { userId } = await requireTenant(ctx, { allowSuperAdmin: true });
    const me = await ctx.db.get(userId);
    if (!me) {
      throw new ConvexError({ code: "NOT_FOUND", message: "User tidak ditemukan" });
    }
    const row = await ctx.db.get(args.skillId);
    if (!row) return null;
    if (me._id !== row.userId && !isAdminRole(me.role)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Tidak diizinkan",
      });
    }
    const patch: Partial<Doc<"employeeSkills">> = {};
    if (args.level !== undefined) {
      if (args.level < 1 || args.level > 5) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Level harus antara 1 dan 5",
        });
      }
      patch.level = args.level;
    }
    if (args.yearsExperience !== undefined)
      patch.yearsExperience = args.yearsExperience;
    if (args.note !== undefined) patch.note = args.note;
    if (args.category !== undefined) patch.category = args.category;
    await ctx.db.patch(args.skillId, patch);
    return null;
  },
});

export const removeSkill = mutation({
  args: { skillId: v.id("employeeSkills") },
  handler: async (ctx, args): Promise<null> => {
    const { userId } = await requireTenant(ctx, { allowSuperAdmin: true });
    const me = await ctx.db.get(userId);
    if (!me) return null;
    const row = await ctx.db.get(args.skillId);
    if (!row) return null;
    if (me._id !== row.userId && !isAdminRole(me.role)) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Tidak diizinkan" });
    }
    await ctx.db.delete(args.skillId);
    return null;
  },
});
