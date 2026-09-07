import { mutation } from "./_generated/server";

export const ensureDevUserAndOrg = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    // 1. Ensure sample organization
    let org = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("isSampleOrg"), true))
      .first();

    if (!org) {
      org = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "pt-star-digital-office"))
        .first();
    }

    let orgId = org?._id;

    if (!orgId) {
      orgId = await ctx.db.insert("organizations", {
        name: "PT Star Digital Office",
        slug: "pt-star-digital-office",
        plan: "enterprise",
        isActive: true,
        isSampleOrg: true,
        createdAt: now,
        address: "Jl. Riau No. 123, Bandung",
        phone: "022-1234567",
        email: "contact@staroffice.id",
        website: "https://staroffice.id",
      });
    }

    // 2. Ensure super_admin user for dev-local-user token
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", "dev-local-user"))
      .unique();

    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", "local-dev-user"))
        .unique();
    }

    if (!user) {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: "local-dev-user",
        name: "Developer Admin",
        email: "admin@local.test",
        role: "super_admin",
        accountStatus: "active",
        organizationId: orgId,
        viewingOrganizationId: orgId,
        lastLoginAt: now,
      });
      return { success: true, userId, orgId, created: true };
    } else {
      await ctx.db.patch(user._id, {
        role: "super_admin",
        accountStatus: "active",
        organizationId: orgId,
        viewingOrganizationId: orgId,
      });
      return { success: true, userId: user._id, orgId, updated: true };
    }
  },
});
