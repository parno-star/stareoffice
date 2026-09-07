import { pgTable, text, timestamp, boolean, integer, serial, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  plan: text("plan").default("enterprise"),
  isActive: boolean("is_active").default(true),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  inviteCode: text("invite_code"),
  isSampleOrg: boolean("is_sample_org").default(false),
  approvalStatus: text("approval_status").default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID / local ID
  tokenIdentifier: text("token_identifier"),
  name: text("name").notNull(),
  nip: text("nip"),
  email: text("email").notNull(),
  department: text("department").default("Operasional"),
  jobTitle: text("job_title").default("Administrator"),
  phone: text("phone"),
  location: text("location").default("Kantor Pusat"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("super_admin"), // super_admin, admin, hr_manager, employee
  accountStatus: text("account_status").default("active"),
  organizationId: integer("organization_id").references(() => organizations.id),
  managerId: integer("manager_id"),
  birthday: text("birthday"),
  dateOfBirth: text("date_of_birth"),
  startDate: text("start_date"),
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  authorId: integer("author_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  category: text("category").default("Umum"),
  isPinned: boolean("is_pinned").default(false),
  status: text("status").default("published"),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Leave Requests (Pengajuan Cuti / Izin)
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  leaveType: text("leave_type").notNull(), // cuti_tahunan, cuti_sakit, izin_khusus, etc.
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  daysCount: integer("days_count").default(1),
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected, cancelled
  approverId: integer("approver_id").references(() => users.id),
  approverNote: text("approver_note"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Attendance (Presensi / Absensi)
export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  status: text("status").default("hadir"), // hadir, terlambat, izin, sakit, alpa
  location: text("location"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. Projects & Tasks
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("in_progress"), // planned, in_progress, completed, on_hold, active
  startDate: text("start_date"),
  endDate: text("end_date"),
  color: text("color").default("blue"),
  leaderId: integer("leader_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo"), // todo, in_progress, review, done
  priority: text("priority").default("medium"), // low, medium, high, urgent
  assigneeId: integer("assignee_id").references(() => users.id),
  dueDate: text("due_date"),
  order: integer("order").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  color: text("color").default("blue"),
  icon: text("icon").default("🏢"),
  headId: integer("head_id").references(() => users.id),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// 8. Letters (Surat Masuk & Keluar)
export const letters = pgTable("letters", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  authorId: integer("author_id").references(() => users.id),
  type: text("type").notNull(), // masuk, keluar
  status: text("status").default("draft"), // draft, sent, archived
  subject: text("subject").notNull(),
  letterNumber: text("letter_number").notNull(),
  letterDate: text("letter_date").notNull(),
  place: text("place").default("Jakarta"),
  classification: text("classification").default("biasa"), // biasa, rahasia, sangat_rahasia
  fromName: text("from_name").notNull(),
  toName: text("to_name").notNull(),
  content: text("content").notNull(),
  category: text("category").default("umum"),
  attachmentCount: integer("attachment_count").default(0),
  dispositionCount: integer("disposition_count").default(0),
  searchText: text("search_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. Policies (Kebijakan Perusahaan)
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  authorId: integer("author_id").references(() => users.id),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  category: text("category").default("hr"), // hr, it, finance, general
  version: text("version").default("1.0"),
  status: text("status").default("published"),
  requiresAcknowledgment: boolean("requires_acknowledgment").default(true),
  effectiveDate: text("effective_date"),
  viewCount: integer("view_count").default(0),
  acknowledgmentCount: integer("acknowledgment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// 10. Fund Requests (Pengajuan Dana / Reimbursement)
export const fundRequests = pgTable("fund_requests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  submitterId: integer("submitter_id").references(() => users.id),
  userDepartment: text("user_department"),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  category: text("category").default("procurement"), // procurement, travel, operational
  amount: integer("amount").notNull(),
  neededBy: text("needed_by"),
  status: text("status").default("pending"), // pending, approved, rejected
  currentApprovalLevel: integer("current_approval_level").default(1),
  totalApprovalLevels: integer("total_approval_levels").default(2),
  createdAt: timestamp("created_at").defaultNow(),
});

// 11. Events (Agenda & Kalender)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  authorId: integer("author_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").default("meeting"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  allDay: boolean("all_day").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 12. Payroll Periods & Payslips
export const payrollPeriods = pgTable("payroll_periods", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  period: text("period").notNull(), // 2026-01
  periodLabel: text("period_label").notNull(), // Januari 2026
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  payDate: text("pay_date").notNull(),
  status: text("status").default("published"),
  totalGross: integer("total_gross").default(0),
  totalDeductions: integer("total_deductions").default(0),
  totalNet: integer("total_net").default(0),
  employeeCount: integer("employee_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payslips = pgTable("payslips", {
  id: serial("id").primaryKey(),
  periodId: integer("period_id").references(() => payrollPeriods.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  userId: integer("user_id").references(() => users.id),
  period: text("period").notNull(),
  basicSalary: integer("basic_salary").notNull(),
  totalEarnings: integer("total_earnings").notNull(),
  totalDeductions: integer("total_deductions").notNull(),
  grossSalary: integer("gross_salary").notNull(),
  netSalary: integer("net_salary").notNull(),
  status: text("status").default("published"),
  userName: text("user_name"),
  userJobTitle: text("user_job_title"),
  userDepartment: text("user_department"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 13. Strategic Issues (Papan Isu Strategis)
export const strategicIssues = pgTable("strategic_issues", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id),
  department: text("department"),
  urgency: text("urgency").default("medium"), // low, medium, high, critical
  impact: text("impact").default("medium"), // low, medium, high
  dueDate: text("due_date"),
  status: text("status").default("needs_decision"), // needs_decision, in_progress, monitoring, resolved
  linkedObjectiveId: integer("linked_objective_id"),
  authorId: integer("author_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  announcements: many(announcements),
  leaveRequests: many(leaveRequests),
  attendances: many(attendances),
  projects: many(projects),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  leaveRequests: many(leaveRequests),
  attendances: many(attendances),
}));
