"use client";

import { useState, useTransition, type FormEvent } from "react";

import { JobStatus } from "@/lib/generated/prisma/enums";
import { updateJobStatus } from "@/lib/jobs/actions";

const BUTTON_CLASSES =
  "inline-flex min-h-12 items-center rounded-lg border border-red-800 px-3 text-sm font-semibold text-red-300 hover:bg-red-950 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60";

const TEXTAREA_CLASSES =
  "min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60";

/**
 * Per-row dispatcher control to cancel an active job. The parent decides whether
 * to render this at all (terminal/completed jobs never receive it); the server
 * action re-checks role, legality and the required reason regardless of the UI.
 */
export function CancelJobButton({ jobId }: Readonly<{ jobId: string }>) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const trimmedReason = reason.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedReason) {
      setError("A cancellation reason is required.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateJobStatus(
        jobId,
        JobStatus.CANCELED,
        undefined,
        trimmedReason,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setReason("");
    });
  }

  if (!open) {
    return (
      <button type="button" className={BUTTON_CLASSES} onClick={() => setOpen(true)}>
        Cancel job
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="sr-only" htmlFor={`cancel-reason-${jobId}`}>
        Cancellation reason
      </label>
      <textarea
        id={`cancel-reason-${jobId}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        disabled={pending}
        aria-invalid={Boolean(error)}
        placeholder="Reason for cancellation"
        className={TEXTAREA_CLASSES}
        rows={2}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !trimmedReason}
          className={BUTTON_CLASSES}
        >
          {pending ? "Canceling…" : "Confirm cancel"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setReason("");
            setError(null);
          }}
          className="inline-flex min-h-12 items-center rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
        >
          Keep job
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
