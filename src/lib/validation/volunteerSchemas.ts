import { z } from "zod";

export const reportVerificationSchema = z
  .object({
    reportId: z.string().min(1, "Report ID is required"),
    status: z.enum(["VERIFIED", "REJECTED"] as const, {
      message: "Status must be either VERIFIED or REJECTED",
    }),
    verificationNote: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "REJECTED" && !data.verificationNote?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Verification note is required when rejecting a report",
      path: ["verificationNote"],
    }
  );

export const pendingReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type ReportVerificationInput = z.infer<typeof reportVerificationSchema>;
export type PendingReportsQuery = z.infer<typeof pendingReportsQuerySchema>;
