import { z } from "zod";

/** Shared by the dispatch assign control and the `assignJob` server action. */
export const assignJobSchema = z.object({
  jobId: z.cuid({ error: "A valid job is required." }),
  userId: z.cuid({ error: "A valid field agent is required." }),
});

export type AssignJobInput = z.infer<typeof assignJobSchema>;
