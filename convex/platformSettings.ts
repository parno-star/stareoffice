import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";
import { requireTenant, getGrantedOrgIds } from "./lib/tenant";

export type PlatformSettings = {
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  allowSelfRegistration: boolean;
  requireOrgApproval: boolean;
  defaultTrialDays: number;
  defaultMaxEmployees: number;
  sessionTimeoutMinutes: number;
  enforceTwoFactorForAdmins: boolean;
  strictTenantIsolation: boolean;
  auditLogRetentionDays: number;
  maintenanceMode: boolean;
  primarySuperAdminId?: string;
  primarySuperAdminEmail?: string;
  updatedAt?: string;
  updatedBy?: string;
};

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: "Sistem Informasi Manajemen Terpadu (SIM)",
  platformDescription: "Platform Enterprise HRIS, Tata Kelola Organisasi, & Manajemen Persuratan Terpadu",
  supportEmail: "admin@enterprise.local",
  allowSelfRegistration: true,
  requireOrgApproval: true,
  defaultTrialDays: 30,
  defaultMaxEmployees: 25,
  sessionTimeoutMinutes: 60,
  enforceTwoFactorForAdmins: false,
  strictTenantIsolation: true,
  auditLogRetentionDays: 365,
  maintenanceMode: false,
};

/**
 * Public/Authenticated Query: Get platform configuration settings.
 */
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx): Promise<PlatformSettings> => {
    const doc = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "platform_initial_setup"))
      .unique();

    if (!doc || !doc.sections) {
      return DEFAULT_PLATFORM_SETTINGS;
    }

    try {
      const raw = doc.sections as Record<string, unknown>;
      return {
        platformName: typeof raw.platformName === "string" ? raw.platformName : DEFAULT_PLATFORM_SETTINGS.platformName,
        platformDescription: typeof raw.platformDescription === "string" ? raw.platformDescription : DEFAULT_PLATFORM_SETTINGS.platformDescription,
        supportEmail: typeof raw.supportEmail === "string" ? raw.supportEmail : DEFAULT_PLATFORM_SETTINGS.supportEmail,
        allowSelfRegistration: typeof raw.allowSelfRegistration === "boolean" ? raw.allowSelfRegistration : DEFAULT_PLATFORM_SETTINGS.allowSelfRegistration,
        requireOrgApproval: typeof raw.requireOrgApproval === "boolean" ? raw.requireOrgApproval : DEFAULT_PLATFORM_SETTINGS.requireOrgApproval,
        defaultTrialDays: typeof raw.defaultTrialDays === "number" ? raw.defaultTrialDays : DEFAULT_PLATFORM_SETTINGS.defaultTrialDays,
        defaultMaxEmployees: typeof raw.defaultMaxEmployees === "number" ? raw.defaultMaxEmployees : DEFAULT_PLATFORM_SETTINGS.defaultMaxEmployees,
        sessionTimeoutMinutes: typeof raw.sessionTimeoutMinutes === "number" ? raw.sessionTimeoutMinutes : DEFAULT_PLATFORM_SETTINGS.sessionTimeoutMinutes,
        enforceTwoFactorForAdmins: typeof raw.enforceTwoFactorForAdmins === "boolean" ? raw.enforceTwoFactorForAdmins : DEFAULT_PLATFORM_SETTINGS.enforceTwoFactorForAdmins,
        strictTenantIsolation: typeof raw.strictTenantIsolation === "boolean" ? raw.strictTenantIsolation : DEFAULT_PLATFORM_SETTINGS.strictTenantIsolation,
        auditLogRetentionDays: typeof raw.auditLogRetentionDays === "number" ? raw.auditLogRetentionDays : DEFAULT_PLATFORM_SETTINGS.auditLogRetentionDays,
        maintenanceMode: typeof raw.maintenanceMode === "boolean" ? raw.maintenanceMode : DEFAULT_PLATFORM_SETTINGS.maintenanceMode,
        primarySuperAdminId: typeof raw.primarySuperAdminId === "string" ? raw.primarySuperAdminId : undefined,
        primarySuperAdminEmail: typeof raw.primarySuperAdminEmail === "string" ? raw.primarySuperAdminEmail : undefined,
        updatedAt: doc.updatedAt,
      };
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  },
});

/**
 * Super Admin Mutation: Update platform initialization & configuration settings.
 */
export const updatePlatformSettings = mutation({
  args: {
    platformName: v.string(),
    platformDescription: v.string(),
    supportEmail: v.string(),
    allowSelfRegistration: v.boolean(),
    requireOrgApproval: v.boolean(),
    defaultTrialDays: v.number(),
    defaultMaxEmployees: v.number(),
    sessionTimeoutMinutes: v.number(),
    enforceTwoFactorForAdmins: v.boolean(),
    strictTenantIsolation: v.boolean(),
    auditLogRetentionDays: v.number(),
    maintenanceMode: v.boolean(),
    primarySuperAdminId: v.optional(v.string()),
    primarySuperAdminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const { userId, isSuperAdmin } = await requireTenant(ctx, { allowSuperAdmin: true });
    if (!isSuperAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hanya Super Admin yang dapat mengubah konfigurasi platform",
      });
    }

    const caller = await ctx.db.get(userId);
    if (!caller) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "platform_initial_setup"))
      .unique();

    const now = new Date().toISOString();
    const payload = {
      platformName: args.platformName,
      platformDescription: args.platformDescription,
      supportEmail: args.supportEmail,
      allowSelfRegistration: args.allowSelfRegistration,
      requireOrgApproval: args.requireOrgApproval,
      defaultTrialDays: args.defaultTrialDays,
      defaultMaxEmployees: args.defaultMaxEmployees,
      sessionTimeoutMinutes: args.sessionTimeoutMinutes,
      enforceTwoFactorForAdmins: args.enforceTwoFactorForAdmins,
      strictTenantIsolation: args.strictTenantIsolation,
      auditLogRetentionDays: args.auditLogRetentionDays,
      maintenanceMode: args.maintenanceMode,
      primarySuperAdminId: args.primarySuperAdminId,
      primarySuperAdminEmail: args.primarySuperAdminEmail,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        sections: payload as unknown as Record<string, boolean>,
        updatedBy: caller._id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: "platform_initial_setup",
        sections: payload as unknown as Record<string, boolean>,
        updatedBy: caller._id,
        updatedAt: now,
      });
    }

    // Record audit event in orgHistory if applicable
    if (caller.organizationId) {
      await ctx.db.insert("orgHistory", {
        organizationId: caller.organizationId,
        actorId: caller._id,
        eventType: "update_platform_settings",
        subjectType: "system_settings",
        subjectName: args.platformName,
        summary: `Super Admin memperbarui konfigurasi sistem platform: ${args.platformName}`,
        timestamp: now,
      });
    }
  },
});

/**
 * Super Admin Query: List all super admins and organizational lead admins.
 */
export const listSuperAdminsAndOrgAdmins = query({
  args: {},
  handler: async (ctx) => {
    const { userId, isSuperAdmin } = await requireTenant(ctx, { allowSuperAdmin: true });
    if (!isSuperAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hanya Super Admin yang dapat melihat daftar administrator",
      });
    }

    const allUsers = await ctx.db.query("users").collect();
    const allOrgs = await ctx.db.query("organizations").collect();

    const orgMap = new Map<string, Doc<"organizations">>();
    for (const org of allOrgs) {
      orgMap.set(org._id, org);
    }

    const superAdmins = allUsers
      .filter((u) => u.role === "super_admin")
      .map((u) => ({
        _id: u._id,
        name: u.name || "Tanpa Nama",
        email: u.email || "-",
        role: u.role || "super_admin",
        jobTitle: u.jobTitle || "Super Administrator",
        department: u.department || "IT & Governance",
        organizationId: u.organizationId,
        orgName: u.organizationId ? orgMap.get(u.organizationId)?.name : "Platform Global",
        accountStatus: u.accountStatus || "active",
        avatarUrl: u.avatarUrl,
        lastLoginAt: u.lastLoginAt,
        _creationTime: u._creationTime,
      }));

    const orgAdmins = allUsers
      .filter((u) => u.role === "admin" || u.role === "hr_manager")
      .map((u) => ({
        _id: u._id,
        name: u.name || "Tanpa Nama",
        email: u.email || "-",
        role: u.role || "admin",
        jobTitle: u.jobTitle || "Organization Admin",
        department: u.department || "Operations",
        organizationId: u.organizationId,
        orgName: u.organizationId ? orgMap.get(u.organizationId)?.name : "Tanpa Organisasi",
        accountStatus: u.accountStatus || "active",
        avatarUrl: u.avatarUrl,
        lastLoginAt: u.lastLoginAt,
        _creationTime: u._creationTime,
      }));

    return {
      superAdmins,
      orgAdmins,
      organizations: allOrgs.map((o) => ({
        _id: o._id,
        name: o.name,
        slug: o.slug,
        plan: o.plan || "free",
        isActive: o.isActive,
      })),
    };
  },
});

/**
 * Super Admin Mutation: Designate or promote a user to Super Admin / Organizational Admin.
 */
export const designateSuperAdmin = mutation({
  args: {
    targetUserId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    role: v.string(), // "super_admin" | "admin"
    jobTitle: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
    confirmationPhrase: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, isSuperAdmin } = await requireTenant(ctx, { allowSuperAdmin: true });
    if (!isSuperAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hanya Super Admin yang berwenang menetapkan role administrator",
      });
    }

    if (args.confirmationPhrase.trim().toUpperCase() !== "KONFIRMASI SUPER ADMIN" && args.confirmationPhrase.trim().toUpperCase() !== "SETUJU") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: 'Frasa verifikasi keamanan tidak sesuai. Masukkan "KONFIRMASI SUPER ADMIN".',
      });
    }

    const caller = await ctx.db.get(userId);
    if (!caller) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    let target: Doc<"users"> | null = null;

    if (args.targetUserId) {
      target = await ctx.db.get(args.targetUserId);
    } else if (args.email) {
      const normalizedEmail = args.email.trim().toLowerCase();
      const usersByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .collect();
      target = usersByEmail[0] || null;
    }

    const now = new Date().toISOString();

    if (target) {
      await ctx.db.patch(target._id, {
        role: args.role,
        accountStatus: "active",
        jobTitle: args.jobTitle || target.jobTitle || (args.role === "super_admin" ? "Super Administrator" : "Organization Admin"),
        organizationId: args.role === "super_admin" && !args.organizationId ? undefined : (args.organizationId || target.organizationId),
      });

      // Update primary designation if requested
      if (args.isPrimary && args.role === "super_admin") {
        const settingsDoc = await ctx.db
          .query("siteSettings")
          .withIndex("by_key", (q) => q.eq("key", "platform_initial_setup"))
          .unique();

        if (settingsDoc) {
          const raw = (settingsDoc.sections || {}) as Record<string, unknown>;
          await ctx.db.patch(settingsDoc._id, {
            sections: {
              ...raw,
              primarySuperAdminId: target._id,
              primarySuperAdminEmail: target.email || args.email || "",
            } as unknown as Record<string, boolean>,
            updatedBy: caller._id,
            updatedAt: now,
          });
        }
      }

      // Record in audit log
      if (caller.organizationId || target.organizationId) {
        await ctx.db.insert("orgHistory", {
          organizationId: (caller.organizationId || target.organizationId) as Id<"organizations">,
          actorId: caller._id,
          eventType: "designate_super_admin",
          subjectType: "user",
          subjectName: target.name || target.email,
          summary: `Pengguna ${target.name || target.email} berhasil ditetapkan sebagai ${args.role === "super_admin" ? "Super Administrator Platform" : "Admin Organisasi"}.`,
          timestamp: now,
        });
      }

      return { success: true, userId: target._id, updated: true };
    } else {
      // Create new user record
      if (!args.email) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Email wajib diisi untuk membuat admin baru",
        });
      }

      const newUserId = await ctx.db.insert("users", {
        tokenIdentifier: `manual:${args.email.trim().toLowerCase()}`,
        email: args.email.trim().toLowerCase(),
        name: args.name || "Administrator Baru",
        role: args.role,
        jobTitle: args.jobTitle || (args.role === "super_admin" ? "Super Administrator" : "Organization Admin"),
        accountStatus: "active",
        organizationId: args.role === "super_admin" && !args.organizationId ? undefined : args.organizationId,
      });

      if (caller.organizationId) {
        await ctx.db.insert("orgHistory", {
          organizationId: caller.organizationId,
          actorId: caller._id,
          eventType: "create_super_admin",
          subjectType: "user",
          subjectName: args.name || args.email,
          summary: `Akun administrator baru ${args.email} dibuat dan ditetapkan sebagai ${args.role === "super_admin" ? "Super Administrator" : "Admin Organisasi"}.`,
          timestamp: now,
        });
      }

      return { success: true, userId: newUserId, created: true };
    }
  },
});
