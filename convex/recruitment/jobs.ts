import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel.d.ts";
import {
  requireUser,
  requireRecruiter,
  canManageRecruitment,
  EMPLOYMENT_TYPES,
  LEVELS,
  JOB_STATUSES,
} from "./_helpers";

export type RecruitmentJobWithMeta = Doc<"recruitmentJobs"> & {
  recruiterName: string | null;
  hiringManagerName: string | null;
  openCount: number;
  activeCount: number;
  hiredCount: number;
};

export const list = query({
  args: {
    status: v.optional(v.string()), // "all" | "draft" | "open" | "on_hold" | "closed"
    department: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Array<RecruitmentJobWithMeta>> => {
    await requireRecruiter(ctx);
    const statusFilter = args.status ?? "open";
    const search = args.search?.trim() ?? "";

    let jobs: Array<Doc<"recruitmentJobs">>;
    if (search) {
      jobs = await ctx.db
        .query("recruitmentJobs")
        .withSearchIndex("search_title", (q) => {
          let sq = q.search("title", search);
          if (statusFilter !== "all") sq = sq.eq("status", statusFilter);
          if (args.department && args.department !== "all") {
            sq = sq.eq("department", args.department);
          }
          return sq;
        })
        .take(200);
    } else if (statusFilter === "all") {
      jobs = await ctx.db.query("recruitmentJobs").order("desc").take(200);
      if (args.department && args.department !== "all") {
        jobs = jobs.filter((j) => j.department === args.department);
      }
    } else {
      jobs = await ctx.db
        .query("recruitmentJobs")
        .withIndex("by_status", (q) => q.eq("status", statusFilter))
        .order("desc")
        .take(200);
      if (args.department && args.department !== "all") {
        jobs = jobs.filter((j) => j.department === args.department);
      }
    }

    const userCache = new Map<Id<"users">, Doc<"users"> | null>();
    const getUser = async (id: Id<"users">) => {
      if (userCache.has(id)) return userCache.get(id) ?? null;
      const u = await ctx.db.get(id);
      userCache.set(id, u);
      return u;
    };

    const results: Array<RecruitmentJobWithMeta> = [];
    for (const job of jobs) {
      const recruiter = job.recruiterId ? await getUser(job.recruiterId) : null;
      const hiringManager = job.hiringManagerId
        ? await getUser(job.hiringManagerId)
        : null;
      const apps = await ctx.db
        .query("candidateApplications")
        .withIndex("by_job", (q) => q.eq("jobId", job._id))
        .collect();
      const activeCount = apps.filter(
        (a) =>
          a.stage !== "hired" &&
          a.stage !== "rejected" &&
          a.stage !== "withdrawn",
      ).length;
      const hiredCount = apps.filter((a) => a.stage === "hired").length;
      results.push({
        ...job,
        recruiterName: recruiter?.name ?? null,
        hiringManagerName: hiringManager?.name ?? null,
        openCount: apps.length,
        activeCount,
        hiredCount,
      });
    }
    return results;
  },
});

export const getById = query({
  args: { id: v.id("recruitmentJobs") },
  handler: async (ctx, args): Promise<RecruitmentJobWithMeta | null> => {
    await requireRecruiter(ctx);
    const job = await ctx.db.get(args.id);
    if (!job) return null;
    const recruiter = job.recruiterId ? await ctx.db.get(job.recruiterId) : null;
    const hiringManager = job.hiringManagerId
      ? await ctx.db.get(job.hiringManagerId)
      : null;
    const apps = await ctx.db
      .query("candidateApplications")
      .withIndex("by_job", (q) => q.eq("jobId", job._id))
      .collect();
    const activeCount = apps.filter(
      (a) =>
        a.stage !== "hired" &&
        a.stage !== "rejected" &&
        a.stage !== "withdrawn",
    ).length;
    const hiredCount = apps.filter((a) => a.stage === "hired").length;
    return {
      ...job,
      recruiterName: recruiter?.name ?? null,
      hiringManagerName: hiringManager?.name ?? null,
      openCount: apps.length,
      activeCount,
      hiredCount,
    };
  },
});

export const listDepartments = query({
  args: {},
  handler: async (ctx): Promise<Array<string>> => {
    await requireRecruiter(ctx);
    const jobs = await ctx.db.query("recruitmentJobs").take(500);
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.department.trim()) set.add(j.department.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  },
});

export const getStats = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    canManage: boolean;
    openCount: number;
    draftCount: number;
    totalCandidates: number;
    activeApplications: number;
    interviewsThisWeek: number;
    hiredThisMonth: number;
  }> => {
    const user = await requireUser(ctx);
    const canManage = canManageRecruitment(user.role);
    if (!canManage) {
      return {
        canManage: false,
        openCount: 0,
        draftCount: 0,
        totalCandidates: 0,
        activeApplications: 0,
        interviewsThisWeek: 0,
        hiredThisMonth: 0,
      };
    }
    const openJobs = await ctx.db
      .query("recruitmentJobs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const draftJobs = await ctx.db
      .query("recruitmentJobs")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .collect();
    const candidates = await ctx.db.query("candidates").take(2000);

    const apps = await ctx.db.query("candidateApplications").take(2000);
    const activeApplications = apps.filter(
      (a) =>
        a.stage !== "hired" &&
        a.stage !== "rejected" &&
        a.stage !== "withdrawn",
    ).length;

    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(weekAhead.getDate() + 7);
    const interviews = await ctx.db
      .query("recruitmentInterviews")
      .withIndex("by_scheduled")
      .order("asc")
      .take(500);
    const interviewsThisWeek = interviews.filter((i) => {
      if (i.status !== "scheduled") return false;
      const dt = new Date(i.scheduledAt);
      return dt >= now && dt <= weekAhead;
    }).length;

    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const hiredThisMonth = apps.filter(
      (a) =>
        a.stage === "hired" &&
        a.hiredAt &&
        new Date(a.hiredAt) >= firstOfMonth,
    ).length;

    return {
      canManage: true,
      openCount: openJobs.length,
      draftCount: draftJobs.length,
      totalCandidates: candidates.length,
      activeApplications,
      interviewsThisWeek,
      hiredThisMonth,
    };
  },
});

function validateJobInput(args: {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  level: string;
  openingDate: string;
  closingDate?: string;
  salaryMin?: number;
  salaryMax?: number;
  headcount: number;
}): void {
  if (!args.title.trim()) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Judul lowongan wajib diisi",
    });
  }
  if (!args.department.trim()) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Departemen wajib diisi",
    });
  }
  if (!args.location.trim()) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Lokasi wajib diisi",
    });
  }
  if (!EMPLOYMENT_TYPES.includes(args.employmentType as (typeof EMPLOYMENT_TYPES)[number])) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Tipe pekerjaan tidak valid",
    });
  }
  if (!LEVELS.includes(args.level as (typeof LEVELS)[number])) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Level posisi tidak valid",
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.openingDate)) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Tanggal buka tidak valid",
    });
  }
  if (args.closingDate && !/^\d{4}-\d{2}-\d{2}$/.test(args.closingDate)) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Tanggal tutup tidak valid",
    });
  }
  if (
    args.salaryMin !== undefined &&
    args.salaryMax !== undefined &&
    args.salaryMin > args.salaryMax
  ) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Gaji minimum tidak boleh lebih besar dari maksimum",
    });
  }
  if (args.headcount < 1 || !Number.isFinite(args.headcount)) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Jumlah posisi harus minimal 1",
    });
  }
}

export const create = mutation({
  args: {
    title: v.string(),
    department: v.string(),
    location: v.string(),
    employmentType: v.string(),
    level: v.string(),
    description: v.string(),
    responsibilities: v.string(),
    requirements: v.string(),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    openingDate: v.string(),
    closingDate: v.optional(v.string()),
    headcount: v.number(),
    status: v.string(),
    hiringManagerId: v.optional(v.id("users")),
    recruiterId: v.optional(v.id("users")),
    internalNote: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"recruitmentJobs">> => {
    const user = await requireRecruiter(ctx);
    validateJobInput(args);
    if (!JOB_STATUSES.includes(args.status as (typeof JOB_STATUSES)[number])) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Status tidak valid",
      });
    }
    return await ctx.db.insert("recruitmentJobs", {
      title: args.title.trim(),
      department: args.department.trim(),
      location: args.location.trim(),
      employmentType: args.employmentType,
      level: args.level,
      description: args.description.trim(),
      responsibilities: args.responsibilities.trim(),
      requirements: args.requirements.trim(),
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      openingDate: args.openingDate,
      closingDate: args.closingDate,
      headcount: Math.round(args.headcount),
      hiredCount: 0,
      status: args.status,
      hiringManagerId: args.hiringManagerId,
      recruiterId: args.recruiterId ?? user._id,
      internalNote: args.internalNote?.trim() || undefined,
      candidateCount: 0,
      postedById: user._id,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recruitmentJobs"),
    title: v.string(),
    department: v.string(),
    location: v.string(),
    employmentType: v.string(),
    level: v.string(),
    description: v.string(),
    responsibilities: v.string(),
    requirements: v.string(),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    openingDate: v.string(),
    closingDate: v.optional(v.string()),
    headcount: v.number(),
    hiringManagerId: v.optional(v.id("users")),
    recruiterId: v.optional(v.id("users")),
    internalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRecruiter(ctx);
    const job = await ctx.db.get(args.id);
    if (!job) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Lowongan tidak ditemukan",
      });
    }
    validateJobInput(args);
    await ctx.db.patch(args.id, {
      title: args.title.trim(),
      department: args.department.trim(),
      location: args.location.trim(),
      employmentType: args.employmentType,
      level: args.level,
      description: args.description.trim(),
      responsibilities: args.responsibilities.trim(),
      requirements: args.requirements.trim(),
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      openingDate: args.openingDate,
      closingDate: args.closingDate,
      headcount: Math.round(args.headcount),
      hiringManagerId: args.hiringManagerId,
      recruiterId: args.recruiterId,
      internalNote: args.internalNote?.trim() || undefined,
    });
    return null;
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("recruitmentJobs"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRecruiter(ctx);
    if (!JOB_STATUSES.includes(args.status as (typeof JOB_STATUSES)[number])) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Status tidak valid",
      });
    }
    const job = await ctx.db.get(args.id);
    if (!job) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Lowongan tidak ditemukan",
      });
    }
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("recruitmentJobs") },
  handler: async (ctx, args) => {
    const user = await requireRecruiter(ctx);
    const job = await ctx.db.get(args.id);
    if (!job) return null;
    if (!isAdminRoleCheck(user.role) && job.postedById !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hanya admin atau pembuat yang dapat menghapus",
      });
    }
    const apps = await ctx.db
      .query("candidateApplications")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .collect();
    for (const a of apps) {
      const notes = await ctx.db
        .query("recruitmentNotes")
        .withIndex("by_application", (q) => q.eq("applicationId", a._id))
        .collect();
      for (const n of notes) await ctx.db.delete(n._id);
      const interviews = await ctx.db
        .query("recruitmentInterviews")
        .withIndex("by_application", (q) => q.eq("applicationId", a._id))
        .collect();
      for (const iv of interviews) await ctx.db.delete(iv._id);
      const cand = await ctx.db.get(a.candidateId);
      if (cand) {
        await ctx.db.patch(cand._id, {
          applicationCount: Math.max(0, cand.applicationCount - 1),
        });
      }
      await ctx.db.delete(a._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

// Local small helper to avoid circular import
function isAdminRoleCheck(role: string | undefined | null): boolean {
  return role === "admin" || role === "super_admin";
}
