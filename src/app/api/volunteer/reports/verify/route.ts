import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { verifyToken } from "@/lib/auth";
import { reportVerificationSchema } from "@/lib/validation/volunteerSchemas";
import { ERROR_CODES } from "@/lib/errorCodes";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication and role
    const { success, user } = verifyToken(req);
    if (!success || !user || user.role !== "volunteer") {
      return sendError(
        "Unauthorized - insufficient permissions",
        ERROR_CODES.AUTH_ERROR,
        401
      );
    }

    const body = await req.json();
    const validated = reportVerificationSchema.parse(body);

    // Check if report exists and is pending
    const report = await prisma.report.findUnique({
      where: { id: validated.reportId },
    });

    if (!report) {
      return sendError("Report not found", ERROR_CODES.NOT_FOUND, 404);
    }

    if (report.status !== "PENDING") {
      return sendError(
        "Report already verified",
        ERROR_CODES.VALIDATION_ERROR,
        409
      );
    }

    // Update report status and create verification record
    const updatedReport = await prisma.report.update({
      where: { id: validated.reportId },
      data: {
        status: validated.status,
        verifiedBy: String(user.id),
        verifiedAt: new Date(),
        remarks: validated.verificationNote,
        rejectionReason:
          validated.status === "REJECTED" ? validated.verificationNote : null,
      },
      include: {
        reporter: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Award points to volunteer for verification (5 points per verification)
    if (validated.status === "VERIFIED") {
      await prisma.user.update({
        where: { id: String(user.id) },
        data: {
          points: {
            increment: 5,
          },
        },
      });

      // Create reward record
      await prisma.reward.create({
        data: {
          userId: String(user.id),
          points: 5,
          action: "REPORT_VERIFICATION",
          description: `Verified report ${validated.reportId}`,
        },
      });
    }

    return sendSuccess(
      updatedReport,
      `Report ${validated.status.toLowerCase()} successfully`
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return sendError(
        error.issues[0]?.message || "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        400,
        error.issues
      );
    }

    console.error("Report verification error:", error);
    return sendError(
      "Failed to verify report",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      {
        originalError: (error as Error)?.message ?? String(error),
      }
    );
  }
}
