import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  MapPin,
  Briefcase,
  Users,
  Clock,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api.js";
import {
  EMPLOYMENT_TYPES,
  LEVELS,
  JOB_STATUS_CONFIG,
  formatSalaryRange,
  type JobStatus,
} from "../_lib/recruitment-utils.ts";

type Job = FunctionReturnType<typeof api.recruitment.jobs.list>[number];

function findLabel(
  collection: ReadonlyArray<{ value: string; label: string }>,
  value: string,
): string {
  return collection.find((x) => x.value === value)?.label ?? value;
}

export default function JobCard({
  job,
  onOpen,
}: {
  job: Job;
  onOpen: (id: Job["_id"]) => void;
}) {
  const statusConfig =
    JOB_STATUS_CONFIG[job.status as JobStatus] ?? JOB_STATUS_CONFIG.open;
  const progress =
    job.headcount > 0
      ? Math.min(100, Math.round((job.hiredCount / job.headcount) * 100))
      : 0;

  return (
    <Card
      className="group cursor-pointer transition-colors hover:border-primary/40"
      onClick={() => onOpen(job._id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{job.title}</h3>
              <Badge variant="outline" className={statusConfig.badge}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.department}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
          >
            Detail
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="size-3.5" />
            {findLabel(EMPLOYMENT_TYPES, job.employmentType)} ·{" "}
            {findLabel(LEVELS, job.level)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {job.candidateCount} kandidat ({job.activeCount} aktif)
          </span>
          {job.closingDate ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              Tutup {job.closingDate}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDistanceToNowStrict(new Date(job._creationTime), {
              locale: idLocale,
              addSuffix: true,
            })}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">
            {formatSalaryRange(job.salaryMin, job.salaryMax)}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {job.hiredCount}/{job.headcount} terisi
            </span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
