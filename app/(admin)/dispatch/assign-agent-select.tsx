"use client";

import { useState, useTransition, type ChangeEvent } from "react";

import { assignJob } from "@/lib/jobs/actions";
import type { FieldAgentOption } from "@/lib/jobs/queries";

const SELECT_CLASSES =
  "min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60";

/**
 * Per-row control to assign or reassign a field agent. The server action is the
 * authority; this only reflects its result. Unassignment is out of scope for
 * this ticket, so the placeholder option is inert.
 */
export function AssignAgentSelect({
  jobId,
  agents,
  assignedUserId,
  disabled,
  disabledLabel,
}: Readonly<{
  jobId: string;
  agents: readonly FieldAgentOption[];
  assignedUserId: string | null;
  disabled?: boolean;
  disabledLabel?: string;
}>) {
  const [selected, setSelected] = useState(assignedUserId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextUserId = event.target.value;
    if (!nextUserId || nextUserId === assignedUserId) {
      return;
    }

    setSelected(nextUserId);
    setError(null);
    startTransition(async () => {
      const result = await assignJob({ jobId, userId: nextUserId });
      if (!result.ok) {
        setSelected(assignedUserId ?? "");
        setError(result.error);
      }
    });
  }

  if (disabled) {
    return (
      <span className="text-sm text-slate-500">{disabledLabel ?? "Unavailable"}</span>
    );
  }

  return (
    <div>
      <label className="sr-only" htmlFor={`assign-${jobId}`}>
        Assign field agent
      </label>
      <select
        id={`assign-${jobId}`}
        value={selected}
        onChange={handleChange}
        disabled={pending}
        aria-invalid={Boolean(error)}
        className={SELECT_CLASSES}
      >
        <option value="">Unassigned</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.email}
          </option>
        ))}
      </select>
      {pending && <p className="mt-1 text-xs text-slate-400">Saving…</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
