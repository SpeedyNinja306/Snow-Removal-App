import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSessionUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { JobStatus, Role } from "@/lib/generated/prisma/enums";

vi.mock("@/lib/authz", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  // The action wraps its write in `db.$transaction`; the audit helper it calls
  // uses the `tx` handle. Sharing the same `job.update` / `auditEvent.create`
  // mocks between `db` and `tx` lets tests assert either way.
  const jobUpdate = vi.fn();
  const auditEventCreate = vi.fn();
  const tx = {
    job: { update: jobUpdate },
    auditEvent: { create: auditEventCreate },
  };

  return {
    db: {
      job: {
        findUnique: vi.fn(),
        update: jobUpdate,
      },
      user: {
        findUnique: vi.fn(),
      },
      auditEvent: {
        create: auditEventCreate,
      },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
      ),
    },
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocks so the action binds to the mocked dependencies.
const { assignJob, updateJobStatus } = await import("@/lib/jobs/actions");

const JOB_ID = "cltestjob0000000000000001";
const AGENT_ID = "cltestagent000000000000001";
const OTHER_AGENT_ID = "cltestagent000000000000009";

/** Shapes returned by the `select` clauses inside `assignJob`. */
type JobForAssignment = {
  id: string;
  status: JobStatus;
  assignedUserId: string | null;
};

type UserForAssignment = {
  id: string;
  role: Role;
  active: boolean;
};

function mockEligibleJob(status: JobStatus = JobStatus.DRAFT) {
  const row: JobForAssignment = {
    id: JOB_ID,
    status,
    assignedUserId: null,
  };
  vi.mocked(db.job.findUnique).mockResolvedValue(
    row as Awaited<ReturnType<typeof db.job.findUnique>>,
  );
}

function mockActiveFieldAgent(active = true) {
  const row: UserForAssignment = {
    id: AGENT_ID,
    role: Role.FIELD_AGENT,
    active,
  };
  vi.mocked(db.user.findUnique).mockResolvedValue(
    row as Awaited<ReturnType<typeof db.user.findUnique>>,
  );
}

describe("assignJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.job.update).mockResolvedValue({
      id: JOB_ID,
      serviceLocationId: "loc1",
      assignedUserId: AGENT_ID,
      status: JobStatus.ASSIGNED,
      holdReason: null,
      cancelReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("allows DISPATCH to assign an eligible job", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "dispatch-user",
      email: "dispatch@example.com",
      role: Role.DISPATCH,
    });
    mockEligibleJob(JobStatus.DRAFT);
    mockActiveFieldAgent();

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({ ok: true });
    expect(db.job.update).toHaveBeenCalledWith({
      where: { id: JOB_ID },
      data: { assignedUserId: AGENT_ID, status: JobStatus.ASSIGNED },
    });
  });

  it("allows OWNER to assign an eligible job", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "owner-user",
      email: "owner@example.com",
      role: Role.OWNER,
    });
    mockEligibleJob(JobStatus.SCHEDULED);
    mockActiveFieldAgent();

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({ ok: true });
    expect(db.job.update).toHaveBeenCalledWith({
      where: { id: JOB_ID },
      data: { assignedUserId: AGENT_ID, status: JobStatus.ASSIGNED },
    });
  });

  it("records an audit event in the same transaction on successful assignment", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "dispatch-user",
      email: "dispatch@example.com",
      role: Role.DISPATCH,
    });
    mockEligibleJob(JobStatus.DRAFT);
    mockActiveFieldAgent();

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({ ok: true });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "dispatch-user",
        actorRole: Role.DISPATCH,
        action: "job.assigned",
        entityType: "Job",
        entityId: JOB_ID,
        summary: `Assigned job to ${AGENT_ID}.`,
        metadata: { previousAssignedUserId: null, newAssignedUserId: AGENT_ID },
      },
    });
  });

  it("audits the previous assignee when reassigning", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "owner-user",
      email: "owner@example.com",
      role: Role.OWNER,
    });
    const PREVIOUS_AGENT_ID = "cltestagent000000000000002";
    const row: JobForAssignment = {
      id: JOB_ID,
      status: JobStatus.ASSIGNED,
      assignedUserId: PREVIOUS_AGENT_ID,
    };
    vi.mocked(db.job.findUnique).mockResolvedValue(
      row as Awaited<ReturnType<typeof db.job.findUnique>>,
    );
    mockActiveFieldAgent();

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({ ok: true });
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "owner-user",
        actorRole: Role.OWNER,
        action: "job.assigned",
        entityType: "Job",
        entityId: JOB_ID,
        summary: `Reassigned job from ${PREVIOUS_AGENT_ID} to ${AGENT_ID}.`,
        metadata: {
          previousAssignedUserId: PREVIOUS_AGENT_ID,
          newAssignedUserId: AGENT_ID,
        },
      },
    });
  });

  it("does not record an audit event when the assignment is rejected", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "dispatch-user",
      email: "dispatch@example.com",
      role: Role.DISPATCH,
    });
    mockEligibleJob(JobStatus.COMPLETED);
    mockActiveFieldAgent();

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result.ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("rejects FIELD_AGENT callers", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "agent-user",
      email: "agent@example.com",
      role: Role.FIELD_AGENT,
    });

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({
      ok: false,
      error: "Only dispatch or the owner can assign jobs.",
    });
    expect(db.job.findUnique).not.toHaveBeenCalled();
  });

  it("rejects assignment to an inactive user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "dispatch-user",
      email: "dispatch@example.com",
      role: Role.DISPATCH,
    });
    mockEligibleJob();
    mockActiveFieldAgent(false);

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({
      ok: false,
      error: "Jobs can only be assigned to an active field agent.",
    });
    expect(db.job.update).not.toHaveBeenCalled();
  });

  it("rejects assignment to a non-FIELD_AGENT user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "dispatch-user",
      email: "dispatch@example.com",
      role: Role.DISPATCH,
    });
    mockEligibleJob();
    const row: UserForAssignment = {
      id: AGENT_ID,
      role: Role.DISPATCH,
      active: true,
    };
    vi.mocked(db.user.findUnique).mockResolvedValue(
      row as Awaited<ReturnType<typeof db.user.findUnique>>,
    );

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({
      ok: false,
      error: "Jobs can only be assigned to an active field agent.",
    });
    expect(db.job.update).not.toHaveBeenCalled();
  });

  it.each([
    JobStatus.COMPLETED,
    JobStatus.CANCELED,
    JobStatus.CLOSED,
  ] as const)("rejects assignment when job status is %s", async (status) => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "dispatch-user",
      email: "dispatch@example.com",
      role: Role.DISPATCH,
    });
    mockEligibleJob(status);
    mockActiveFieldAgent();

    const result = await assignJob({ jobId: JOB_ID, userId: AGENT_ID });

    expect(result).toEqual({
      ok: false,
      error: `A ${status} job is closed to assignment.`,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.job.update).not.toHaveBeenCalled();
  });
});

describe("updateJobStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.job.update).mockResolvedValue({
      id: JOB_ID,
      serviceLocationId: "loc1",
      assignedUserId: AGENT_ID,
      status: JobStatus.EN_ROUTE,
      holdReason: null,
      cancelReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  /** Mocks the `findUnique` lookup inside the action for one call. */
  function mockJob(status: JobStatus, assignedUserId: string | null = AGENT_ID) {
    const row = { id: JOB_ID, status, assignedUserId };
    vi.mocked(db.job.findUnique).mockResolvedValue(
      row as Awaited<ReturnType<typeof db.job.findUnique>>,
    );
  }

  function asDispatch() {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "dispatch-user",
      email: "dispatch@example.com",
      role: Role.DISPATCH,
    });
  }

  function asAgent(id = AGENT_ID) {
    vi.mocked(getSessionUser).mockResolvedValue({
      id,
      email: "agent@example.com",
      role: Role.FIELD_AGENT,
    });
  }

  it("advances a job through sequential legal transitions", async () => {
    asAgent();

    mockJob(JobStatus.ASSIGNED);
    expect(await updateJobStatus(JOB_ID, JobStatus.EN_ROUTE)).toEqual({ ok: true });

    mockJob(JobStatus.EN_ROUTE);
    expect(await updateJobStatus(JOB_ID, JobStatus.IN_PROGRESS)).toEqual({ ok: true });

    mockJob(JobStatus.IN_PROGRESS);
    expect(await updateJobStatus(JOB_ID, JobStatus.COMPLETED)).toEqual({ ok: true });

    expect(db.job.update).toHaveBeenNthCalledWith(1, {
      where: { id: JOB_ID },
      data: { status: JobStatus.EN_ROUTE },
    });
    expect(db.job.update).toHaveBeenNthCalledWith(3, {
      where: { id: JOB_ID },
      data: { status: JobStatus.COMPLETED },
    });
  });

  it("lets DISPATCH transition a job it is not assigned to", async () => {
    asDispatch();
    mockJob(JobStatus.IN_PROGRESS, OTHER_AGENT_ID);

    const result = await updateJobStatus(JOB_ID, JobStatus.COMPLETED);

    expect(result).toEqual({ ok: true });
  });

  it("rejects an illegal transition without opening a transaction", async () => {
    asDispatch();
    mockJob(JobStatus.ASSIGNED);

    const result = await updateJobStatus(JOB_ID, JobStatus.CLOSED);

    expect(result).toEqual({
      ok: false,
      error: `Cannot move a job from ${JobStatus.ASSIGNED} to ${JobStatus.CLOSED}.`,
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.job.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("rejects a field agent updating a job assigned to someone else", async () => {
    asAgent(AGENT_ID);
    mockJob(JobStatus.ASSIGNED, OTHER_AGENT_ID);

    const result = await updateJobStatus(JOB_ID, JobStatus.EN_ROUTE);

    expect(result).toEqual({
      ok: false,
      error: "You can only update jobs assigned to you.",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("rejects a field agent attempting to cancel a job", async () => {
    asAgent();
    // ASSIGNED -> CANCELED is a legal transition and a valid reason is supplied
    // (so it clears Zod), leaving the field-agent role gate as the only thing
    // that can reject — proving cancellation is dispatcher-only.
    mockJob(JobStatus.ASSIGNED);

    const result = await updateJobStatus(
      JOB_ID,
      JobStatus.CANCELED,
      undefined,
      "Field agent tried to cancel",
    );

    expect(result).toEqual({
      ok: false,
      error: "Only dispatch or the owner can cancel a job.",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("rejects ON_HOLD without a reason and never touches the database", async () => {
    asAgent();

    const result = await updateJobStatus(JOB_ID, JobStatus.ON_HOLD);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid status update request.");
      expect(result.fieldErrors?.holdReason).toBeDefined();
    }
    // Validation fails before the job is even loaded.
    expect(db.job.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("records a status-change audit event in the same transaction on success", async () => {
    asAgent();
    mockJob(JobStatus.ASSIGNED);

    const result = await updateJobStatus(JOB_ID, JobStatus.EN_ROUTE);

    expect(result).toEqual({ ok: true });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: AGENT_ID,
        actorRole: Role.FIELD_AGENT,
        action: "job.status_changed",
        entityType: "Job",
        entityId: JOB_ID,
        summary: `Job status ${JobStatus.ASSIGNED} -> ${JobStatus.EN_ROUTE}.`,
        metadata: {
          previousStatus: JobStatus.ASSIGNED,
          newStatus: JobStatus.EN_ROUTE,
        },
      },
    });
  });

  it("persists and audits the reason when placing a job ON_HOLD", async () => {
    asAgent();
    mockJob(JobStatus.IN_PROGRESS);

    const result = await updateJobStatus(
      JOB_ID,
      JobStatus.ON_HOLD,
      "Waiting on plow truck",
    );

    expect(result).toEqual({ ok: true });
    expect(db.job.update).toHaveBeenCalledWith({
      where: { id: JOB_ID },
      data: { status: JobStatus.ON_HOLD, holdReason: "Waiting on plow truck" },
    });
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: AGENT_ID,
        actorRole: Role.FIELD_AGENT,
        action: "job.status_changed",
        entityType: "Job",
        entityId: JOB_ID,
        summary: `Job status ${JobStatus.IN_PROGRESS} -> ${JobStatus.ON_HOLD}.`,
        metadata: {
          previousStatus: JobStatus.IN_PROGRESS,
          newStatus: JobStatus.ON_HOLD,
          holdReason: "Waiting on plow truck",
        },
      },
    });
  });

  it("rejects CANCELED without a reason and never touches the database", async () => {
    asDispatch();

    const result = await updateJobStatus(JOB_ID, JobStatus.CANCELED);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid status update request.");
      expect(result.fieldErrors?.cancelReason).toBeDefined();
    }
    // Validation fails before the job is even loaded.
    expect(db.job.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("persists and audits the reason when DISPATCH cancels a job", async () => {
    asDispatch();
    mockJob(JobStatus.ASSIGNED, OTHER_AGENT_ID);

    const result = await updateJobStatus(
      JOB_ID,
      JobStatus.CANCELED,
      undefined,
      "Customer canceled service",
    );

    expect(result).toEqual({ ok: true });
    expect(db.job.update).toHaveBeenCalledWith({
      where: { id: JOB_ID },
      data: { status: JobStatus.CANCELED, cancelReason: "Customer canceled service" },
    });
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "dispatch-user",
        actorRole: Role.DISPATCH,
        action: "job.status_changed",
        entityType: "Job",
        entityId: JOB_ID,
        summary: `Job status ${JobStatus.ASSIGNED} -> ${JobStatus.CANCELED}.`,
        metadata: {
          previousStatus: JobStatus.ASSIGNED,
          newStatus: JobStatus.CANCELED,
          cancelReason: "Customer canceled service",
        },
      },
    });
  });
});
