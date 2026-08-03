import { SessionProof } from "@/components/session-proof";
import { requireRoles } from "@/lib/authz";
import { JobStatus, Role } from "@/lib/generated/prisma/enums";
import { listJobsForAgent } from "@/lib/jobs/queries";
import { legalNextStatuses } from "@/lib/jobs/status";
import { getOpenShiftForUser } from "@/lib/time/queries";

import { ClockControl } from "./clock-control";
import { JobStatusControl } from "./job-status-control";

const ALLOWED_ROLES = [Role.FIELD_AGENT] as const;

export const metadata = {
  title: "My work · SR-App",
};

export default async function FieldHomePage() {
  // Re-checked here, not just in the layout: layouts do not re-render on every
  // client-side navigation, so the gate has to sit next to the data too.
  const user = await requireRoles(ALLOWED_ROLES);
  const [jobs, openShift] = await Promise.all([
    listJobsForAgent(user.id),
    getOpenShiftForUser(user.id),
  ]);

  return (
    <section>
      <h1 className="text-xl font-semibold">My work</h1>
      <p className="mt-1 text-sm text-slate-400">
        Jobs assigned to you. Clock in when your shift starts, then advance a
        job through its legal next statuses below.
      </p>
      <SessionProof user={user} allowedRoles={ALLOWED_ROLES} />

      <ClockControl initialShift={openShift} />

      <ul className="mt-4 space-y-3">
        {jobs.length === 0 ? (
          <li className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
            No jobs assigned to you yet.
          </li>
        ) : (
          jobs.map((job) => {
            // Options come straight from the state machine; CANCELED is removed
            // because cancellation is dispatcher-only (the action rejects it
            // from a field agent), so offering it here would mislead.
            const nextStatuses = legalNextStatuses(job.status).filter(
              (status) => status !== JobStatus.CANCELED,
            );

            return (
              <li
                key={job.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {job.serviceLocation.customer.name}
                  </span>
                  <span className="rounded-md border border-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300">
                    {job.status}
                  </span>
                </div>
                <p className="mt-1 text-slate-400">
                  {job.serviceLocation.addressLine1}, {job.serviceLocation.city},{" "}
                  {job.serviceLocation.state}
                </p>
                <JobStatusControl jobId={job.id} nextStatuses={nextStatuses} />
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
