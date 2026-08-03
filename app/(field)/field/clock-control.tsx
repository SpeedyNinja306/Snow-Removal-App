"use client";

import { useEffect, useState, useTransition } from "react";

import { clockIn, clockOut } from "@/lib/time/actions";
import type { OpenShiftStatus } from "@/lib/time/queries";

const ACTION_BUTTON =
  "min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60";

function formatElapsed(clockInAt: Date, now: Date): string {
  const totalSeconds = Math.max(0, Math.floor((now.getTime() - clockInAt.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/**
 * Field-agent shift clock control. Initial shift state is fetched on the
 * server; elapsed time ticks client-side while clocked in.
 */
export function ClockControl({
  initialShift,
}: Readonly<{
  initialShift: OpenShiftStatus;
}>) {
  const [shift, setShift] = useState(initialShift);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!shift.isClockedIn) {
      return;
    }

    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [shift.isClockedIn]);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = shift.isClockedIn ? await clockOut() : await clockIn();
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (shift.isClockedIn) {
        setShift({ isClockedIn: false });
      } else {
        setShift({
          isClockedIn: true,
          timeEntryId: result.timeEntryId,
          clockInAt: new Date(),
        });
        setNow(new Date());
      }
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Shift</h2>
          {shift.isClockedIn ? (
            <p className="mt-1 font-mono text-lg tabular-nums text-sky-300">
              {formatElapsed(shift.clockInAt, now)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Not clocked in</p>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={ACTION_BUTTON}
          style={{ maxWidth: "10rem" }}
        >
          {pending ? "Saving…" : shift.isClockedIn ? "Clock Out" : "Clock In"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
