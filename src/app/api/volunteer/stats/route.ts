import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { verifyToken } from "@/lib/auth";
import { ERROR_CODES } from "@/lib/errorCodes";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication and role
    const { success, user } = verifyToken(req);
    if (!success || !user) {
      return sendError(
        "Unauthorized - please log in",
        ERROR_CODES.AUTH_ERROR,
        401
      );
    }

    if (user.role !== "volunteer") {
      return sendError("Insufficient permissions", ERROR_CODES.AUTH_ERROR, 403);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get counts for dashboard
    const [pendingCount, verifiedTodayCount, totalVerifiedCount] =
      await Promise.all([
        // Pending reports count
        prisma.report.count({
          where: { status: "PENDING" },
        }),

        // Verified today count (by this volunteer)
        prisma.report.count({
          where: {
            status: "VERIFIED",
            verifiedBy: String(user.id),
            verifiedAt: {
              gte: today,
            },
          },
        }),

        // Total verified count (by this volunteer)
        prisma.report.count({
          where: {
            status: "VERIFIED",
            verifiedBy: String(user.id),
          },
        }),
      ]);

    return sendSuccess(
      {
        pending: pendingCount,
        verifiedToday: verifiedTodayCount,
        totalVerified: totalVerifiedCount,
      },
      "Stats fetched successfully"
    );
  } catch (error: unknown) {
    console.error("Volunteer stats fetch error:", error);
    return sendError(
      "Failed to fetch stats",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      {
        originalError: (error as Error)?.message ?? String(error),
      }
    );
  }
}
