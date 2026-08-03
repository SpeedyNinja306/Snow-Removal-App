"use client";

import { useState, useTransition } from "react";

import { updateJobStatus } from "@/lib/jobs/actions";
import { JobStatus } from "@/lib/generated/prisma/enums";

const ACTION_BUTTON =
  "min-h-12 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60";

const REASON_INPUT =
  "min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60";

/** Human labels for the transitions a field agent can reach. */
const STATUS_LABELS: Readonly<Record<JobStatus, string>> = {
  [JobStatus.DRAFT]: "Draft",
  [JobStatus.SCHEDULED]: "Scheduled",
  [JobStatus.ASSIGNED]: "Assigned",
  [JobStatus.EN_ROUTE]: "En route",
  [JobStatus.IN_PROGRESS]: "In progress",
  [JobStatus.ON_HOLD]: "On hold",
  [JobStatus.COMPLETED]: "Completed",
  [JobStatus.CANCELED]: "Canceled",
  [JobStatus.CLOSED]: "Closed",
};

/**
 * Field-agent status control. The legal next statuses are computed on the
 * server from the state machine and passed in — this island never hardcodes a
 * transition list. The server action remains the real enforcement; this only
 * reflects its result. ON_HOLD is the one transition that needs a reason, so a
 * reason field appears only when ON_HOLD is offered.
 */
export function JobStatusControl({
  jobId,
  nextStatuses,
}: Readonly<{
  jobId: string;
  nextStatuses: readonly JobStatus[];
}>) {
  const [holdReason, setHoldReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<JobStatus | null>(null);
  const [pending, startTransition] = useTransition();

  if (nextStatuses.length === 0) {
    return (
      <p className="mt-3 text-xs text-slate-500">No status changes available.</p>
    );
  }

  const offersHold = nextStatuses.includes(JobStatus.ON_HOLD);

  function submit(target: JobStatus) {
    const reason = target === JobStatus.ON_HOLD ? holdReason.trim() : undefined;
    if (target === JobStatus.ON_HOLD && !reason) {
      setError("Enter a reason before placing the job on hold.");
      return;
    }

    setError(null);
    setPendingStatus(target);
    startTransition(async () => {
      const result = await updateJobStatus(jobId, target, reason);
      if (!result.ok) {
        setError(result.error);
      } else if (target === JobStatus.ON_HOLD) {
        setHoldReason("");
      }
      setPendingStatus(null);
    });
  }

  return (
    <div className="mt-3 space-y-2">
      {offersHold && (
        <div>
          <label className="sr-only" htmlFor={`hold-reason-${jobId}`}>
            Hold reason
          </label>
          <input
            id={`hold-reason-${jobId}`}
            type="text"
            value={holdReason}
            onChange={(event) => setHoldReason(event.target.value)}
            placeholder="Reason (required to put on hold)"
            disabled={pending}
            className={REASON_INPUT}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => submit(status)}
            disabled={pending}
            className={ACTION_BUTTON}
          >
            {pending && pendingStatus === status
              ? "Saving…"
              : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
