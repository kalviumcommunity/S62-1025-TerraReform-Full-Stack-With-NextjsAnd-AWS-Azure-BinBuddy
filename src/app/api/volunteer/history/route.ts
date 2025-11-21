import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { verifyToken } from "@/lib/auth";
import { pendingReportsQuerySchema } from "@/lib/validation/volunteerSchemas";
import { ERROR_CODES } from "@/lib/errorCodes";
import { ZodError } from "zod";

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

    const { searchParams } = new URL(req.url);
    const status =
      (searchParams.get("status") as "VERIFIED" | "REJECTED") || "VERIFIED";
    const validatedQuery = pendingReportsQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get verification history (reports verified by this volunteer)
    const reports = await prisma.report.findMany({
      where: {
        verifiedBy: String(user.id),
        status: status,
      },
      include: {
        reporter: {
          select: {
            email: true,
            name: true,
          },
        },
        images: {
          take: 1,
        },
      },
      orderBy: {
        verifiedAt: "desc",
      },
      skip,
      take: validatedQuery.limit,
    });

    const totalCount = await prisma.report.count({
      where: {
        verifiedBy: String(user.id),
        status: status,
      },
    });

    return sendSuccess(
      {
        reports,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / validatedQuery.limit),
        },
      },
      "Verification history fetched successfully"
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

    console.error("Verification history fetch error:", error);
    return sendError(
      "Failed to fetch verification history",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      {
        originalError: (error as Error)?.message ?? String(error),
      }
    );
  }
}
