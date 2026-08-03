import Link from "next/link";

import { SessionProof } from "@/components/session-proof";
import { requireRoles } from "@/lib/authz";
import { ADMIN_ROLES, OWNER_HOME } from "@/lib/authz/routes";
import { Role } from "@/lib/generated/prisma/enums";
import {
  listActiveFieldAgents,
  listJobsForDispatchBoard,
} from "@/lib/jobs/queries";
import { isAssignmentBlocked } from "@/lib/jobs/status";
import { listCurrentlyClockedInAgents } from "@/lib/time/queries";

import { AssignAgentSelect } from "./assign-agent-select";

export const metadata = {
  title: "Dispatch · SR-App",
};

export default async function DispatchHomePage() {
  const user = await requireRoles(ADMIN_ROLES);
  const [jobs, agents, clockedInAgents] = await Promise.all([
    listJobsForDispatchBoard(),
    listActiveFieldAgents(),
    listCurrentlyClockedInAgents(),
  ]);

  return (
    <section>
      <h1 className="text-xl font-semibold">Dispatch</h1>
      <p className="mt-1 text-sm text-slate-400">
        Field-agent assignment is live below. Truck assignment, filters, and
        coarse location freshness arrive with their own feature tickets — this
        is not yet the full dispatch board.
      </p>
      <SessionProof user={user} allowedRoles={ADMIN_ROLES} />

      <section className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Clocked in now</h2>
        {clockedInAgents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No agents are clocked in.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {clockedInAgents.map((agent) => (
              <li key={agent.timeEntryId} className="text-slate-300">
                {agent.email}{" "}
                <span className="text-slate-500">
                  (since {agent.clockInAt.toLocaleTimeString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <table className="mt-4 border border-slate-700 text-sm">
        <thead>
          <tr>
            <th className="border border-slate-700 px-2 py-1 text-left">Job ID</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Customer</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Location</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Status</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Assigned agent</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td className="border border-slate-700 px-2 py-1" colSpan={6}>
                No jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id}>
                <td className="border border-slate-700 px-2 py-1">{job.id}</td>
                <td className="border border-slate-700 px-2 py-1">
                  {job.serviceLocation.customer.name}
                </td>
                <td className="border border-slate-700 px-2 py-1">
                  {job.serviceLocation.addressLine1}, {job.serviceLocation.city},{" "}
                  {job.serviceLocation.state}
                </td>
                <td className="border border-slate-700 px-2 py-1">{job.status}</td>
                <td className="border border-slate-700 px-2 py-1 align-top">
                  <AssignAgentSelect
                    jobId={job.id}
                    agents={agents}
                    assignedUserId={job.assignedUser?.id ?? null}
                    disabled={isAssignmentBlocked(job.status)}
                    disabledLabel={`${job.status} — not assignable`}
                  />
                </td>
                <td className="border border-slate-700 px-2 py-1">
                  {job.createdAt.toISOString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {user.role === Role.OWNER && (
        <Link
          href={OWNER_HOME}
          className="mt-4 inline-flex min-h-12 items-center rounded-lg border border-slate-700 px-4 text-sm font-semibold hover:bg-slate-800"
        >
          Owner oversight
        </Link>
      )}
    </section>
  );
}
