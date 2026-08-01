import Link from "next/link";

import { SessionProof } from "@/components/session-proof";
import { requireRoles } from "@/lib/authz";
import { ADMIN_ROLES, OWNER_HOME } from "@/lib/authz/routes";
import { Role } from "@/lib/generated/prisma/enums";
import { listJobsForDispatchBoard } from "@/lib/jobs/queries";

export const metadata = {
  title: "Dispatch · SR-App",
};

export default async function DispatchHomePage() {
  const user = await requireRoles(ADMIN_ROLES);
  const jobs = await listJobsForDispatchBoard();

  return (
    <section>
      <h1 className="text-xl font-semibold">Dispatch</h1>
      <p className="mt-1 text-sm text-slate-400">
        Placeholder surface. Truck assignment, invoices and payments arrive
        with their own feature tickets. The table below is an unstyled proof
        that Job/ServiceLocation/Customer read through Prisma — it is not the
        real dispatch board (no filters, agent assignment, or freshness yet).
      </p>
      <SessionProof user={user} allowedRoles={ADMIN_ROLES} />

      <table className="mt-4 border border-slate-700 text-sm">
        <thead>
          <tr>
            <th className="border border-slate-700 px-2 py-1 text-left">Job ID</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Customer</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Location</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Status</th>
            <th className="border border-slate-700 px-2 py-1 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td className="border border-slate-700 px-2 py-1" colSpan={5}>
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
