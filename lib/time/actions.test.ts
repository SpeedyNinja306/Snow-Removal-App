import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSessionUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { Role } from "@/lib/generated/prisma/enums";

vi.mock("@/lib/authz", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const timeEntryFindFirst = vi.fn();
  const timeEntryCreate = vi.fn();
  const timeEntryUpdate = vi.fn();
  const auditEventCreate = vi.fn();
  const tx = {
    timeEntry: {
      create: timeEntryCreate,
      update: timeEntryUpdate,
    },
    auditEvent: { create: auditEventCreate },
  };

  return {
    db: {
      timeEntry: {
        findFirst: timeEntryFindFirst,
        create: timeEntryCreate,
        update: timeEntryUpdate,
      },
      auditEvent: { create: auditEventCreate },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
      ),
    },
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { clockIn, clockOut } = await import("@/lib/time/actions");

const AGENT_ID = "cltestagent000000000000001";
const OTHER_AGENT_ID = "cltestagent000000000000009";
const TIME_ENTRY_ID = "cltesttime0000000000000001";
const CLOCK_IN_AT = new Date("2026-08-03T18:00:00.000Z");

function asFieldAgent(id = AGENT_ID) {
  vi.mocked(getSessionUser).mockResolvedValue({
    id,
    email: "agent@example.com",
    role: Role.FIELD_AGENT,
  });
}

function asDispatch() {
  vi.mocked(getSessionUser).mockResolvedValue({
    id: "dispatch-user",
    email: "dispatch@example.com",
    role: Role.DISPATCH,
  });
}

describe("clockIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.timeEntry.create).mockResolvedValue({
      id: TIME_ENTRY_ID,
      userId: AGENT_ID,
      clockInAt: CLOCK_IN_AT,
      clockOutAt: null,
      createdAt: CLOCK_IN_AT,
    });
  });

  it("completes a successful clock-in cycle", async () => {
    asFieldAgent();
    vi.mocked(db.timeEntry.findFirst).mockResolvedValue(null);

    const result = await clockIn();

    expect(result).toEqual({ ok: true, timeEntryId: TIME_ENTRY_ID });
    expect(db.timeEntry.create).toHaveBeenCalledWith({
      data: { userId: AGENT_ID },
      select: { id: true, clockInAt: true },
    });
  });

  it("rejects double clock-in when an open shift exists", async () => {
    asFieldAgent();
    vi.mocked(db.timeEntry.findFirst).mockResolvedValue({
      id: TIME_ENTRY_ID,
      userId: AGENT_ID,
      clockInAt: CLOCK_IN_AT,
      clockOutAt: null,
      createdAt: CLOCK_IN_AT,
    });

    const result = await clockIn();

    expect(result).toEqual({ ok: false, error: "You are already clocked in." });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("records an audit event in the same transaction on successful clock-in", async () => {
    asFieldAgent();
    vi.mocked(db.timeEntry.findFirst).mockResolvedValue(null);

    const result = await clockIn();

    expect(result).toEqual({ ok: true, timeEntryId: TIME_ENTRY_ID });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: AGENT_ID,
        actorRole: Role.FIELD_AGENT,
        action: "time.clock_in",
        entityType: "TimeEntry",
        entityId: TIME_ENTRY_ID,
        summary: `Clocked in at ${CLOCK_IN_AT.toISOString()}.`,
        metadata: { clockInAt: CLOCK_IN_AT.toISOString() },
      },
    });
  });

  it("rejects non-field-agent callers (cross-user / wrong role)", async () => {
    asDispatch();

    const result = await clockIn();

    expect(result).toEqual({ ok: false, error: "Only field agents can clock in." });
    expect(db.timeEntry.findFirst).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });
});

describe("clockOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.timeEntry.update).mockResolvedValue({
      id: TIME_ENTRY_ID,
      userId: AGENT_ID,
      clockInAt: CLOCK_IN_AT,
      clockOutAt: new Date("2026-08-03T22:00:00.000Z"),
      createdAt: CLOCK_IN_AT,
    });
  });

  it("completes a successful clock-out after clock-in", async () => {
    asFieldAgent();
    vi.mocked(db.timeEntry.findFirst).mockResolvedValue({
      id: TIME_ENTRY_ID,
      userId: AGENT_ID,
      clockInAt: CLOCK_IN_AT,
      clockOutAt: null,
      createdAt: CLOCK_IN_AT,
    });

    const result = await clockOut();

    expect(result).toEqual({ ok: true, timeEntryId: TIME_ENTRY_ID });
    expect(db.timeEntry.update).toHaveBeenCalledWith({
      where: { id: TIME_ENTRY_ID },
      data: { clockOutAt: expect.any(Date) },
    });
  });

  it("rejects clock-out when no open shift exists", async () => {
    asFieldAgent();
    vi.mocked(db.timeEntry.findFirst).mockResolvedValue(null);

    const result = await clockOut();

    expect(result).toEqual({ ok: false, error: "You are not clocked in." });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("records an audit event in the same transaction on successful clock-out", async () => {
    asFieldAgent();
    vi.mocked(db.timeEntry.findFirst).mockResolvedValue({
      id: TIME_ENTRY_ID,
      userId: AGENT_ID,
      clockInAt: CLOCK_IN_AT,
      clockOutAt: null,
      createdAt: CLOCK_IN_AT,
    });

    const result = await clockOut();

    expect(result).toEqual({ ok: true, timeEntryId: TIME_ENTRY_ID });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: AGENT_ID,
        actorRole: Role.FIELD_AGENT,
        action: "time.clock_out",
        entityType: "TimeEntry",
        entityId: TIME_ENTRY_ID,
        metadata: expect.objectContaining({
          clockInAt: CLOCK_IN_AT.toISOString(),
          clockOutAt: expect.any(String),
        }),
      }),
    });
  });

  it("rejects non-field-agent callers (cross-user / wrong role)", async () => {
    asDispatch();

    const result = await clockOut();

    expect(result).toEqual({ ok: false, error: "Only field agents can clock out." });
    expect(db.timeEntry.findFirst).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("scopes open-shift lookup to the session user, not another agent", async () => {
    asFieldAgent(OTHER_AGENT_ID);
    vi.mocked(db.timeEntry.findFirst).mockResolvedValue(null);

    const result = await clockOut();

    expect(result).toEqual({ ok: false, error: "You are not clocked in." });
    expect(db.timeEntry.findFirst).toHaveBeenCalledWith({
      where: { userId: OTHER_AGENT_ID, clockOutAt: null },
      select: { id: true, clockInAt: true },
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
