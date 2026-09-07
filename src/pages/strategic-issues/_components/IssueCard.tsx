import { Link } from "react-router-dom";
import { format, isPast, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  UserCircle,
  Building2,
  CalendarClock,
  Target,
  Pencil,
  Trash2,
  Zap,
  Gauge,
} from "lucide-react";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";
import {
  URGENCY_LABEL,
  IMPACT_LABEL,
  URGENCY_BADGE,
  STATUS_ACCENT,
  STATUS_OPTIONS,
} from "../_lib/constants.ts";
import type { StrategicIssueRow } from "../page.tsx";

export default function IssueCard({
  issue,
  canManage,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  issue: StrategicIssueRow;
  canManage: boolean;
  onEdit: (issue: StrategicIssueRow) => void;
  onDelete: (issue: StrategicIssueRow) => void;
  onStatusChange: (issue: StrategicIssueRow, status: string) => void;
}) {
  const overdue =
    issue.status !== "resolved" &&
    !!issue.dueDate &&
    isPast(parseISO(issue.dueDate));

  const dueLabel = issue.dueDate
    ? format(parseISO(issue.dueDate), "d MMM yyyy", { locale: idLocale })
    : null;

  return (
    <Card
      className={cn(
        "gap-0 border-l-4 p-4",
        STATUS_ACCENT[issue.status] ?? "border-l-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                URGENCY_BADGE[issue.urgency] ?? URGENCY_BADGE.low,
              )}
            >
              <Zap className="size-3" />
              {URGENCY_LABEL[issue.urgency] ?? issue.urgency}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Gauge className="size-3" />
              Dampak {IMPACT_LABEL[issue.impact] ?? issue.impact}
            </span>
          </div>
          <h3 className="mt-2 font-semibold leading-tight">{issue.title}</h3>
          {issue.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {issue.description}
            </p>
          ) : null}
        </div>

        {canManage ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => onEdit(issue)}
              aria-label="Edit isu"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(issue)}
              aria-label="Hapus isu"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UserCircle className="size-3.5" />
          {issue.ownerName ?? "Tanpa PIC"}
        </span>
        {issue.department ? (
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-3.5" />
            {issue.department}
          </span>
        ) : null}
        {dueLabel ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              overdue && "font-medium text-rose-600 dark:text-rose-400",
            )}
          >
            <CalendarClock className="size-3.5" />
            {overdue ? `Lewat tenggat · ${dueLabel}` : `Tenggat ${dueLabel}`}
          </span>
        ) : null}
        {issue.linkedObjectiveId ? (
          <Link
            to="/okr"
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <Target className="size-3.5" />
            {issue.linkedObjectiveTitle ?? "Objektif tertaut"}
          </Link>
        ) : null}
      </div>

      {/* Status control / label */}
      <div className="mt-3 border-t pt-3">
        {canManage ? (
          <Select
            value={issue.status}
            onValueChange={(v) => onStatusChange(issue, v)}
          >
            <SelectTrigger size="sm" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </Card>
  );
}
