import { JobStatus } from "@/lib/generated/prisma/enums";

// Tailwind cannot see dynamically-built class names, so each status maps to a
// complete, statically-analysable class string (badge background + text).
const STATUS_STYLES: Readonly<Record<JobStatus, string>> = {
  [JobStatus.DRAFT]: "bg-slate-700 text-slate-100",
  [JobStatus.SCHEDULED]: "bg-blue-600 text-blue-50",
  [JobStatus.ASSIGNED]: "bg-indigo-600 text-indigo-50",
  [JobStatus.EN_ROUTE]: "bg-amber-500 text-amber-950",
  [JobStatus.IN_PROGRESS]: "bg-green-600 text-green-50",
  [JobStatus.ON_HOLD]: "bg-orange-500 text-orange-950",
  [JobStatus.COMPLETED]: "bg-teal-600 text-teal-50",
  [JobStatus.CANCELED]: "bg-red-600 text-red-50",
  [JobStatus.CLOSED]: "bg-slate-800 text-slate-400",
};

/** Read-only colored status pill for the dispatch board. */
export function JobStatusBadge({ status }: Readonly<{ status: JobStatus }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
