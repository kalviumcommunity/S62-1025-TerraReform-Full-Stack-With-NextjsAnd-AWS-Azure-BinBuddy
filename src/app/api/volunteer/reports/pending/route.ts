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
    const validatedQuery = pendingReportsQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get pending reports
    const reports = await prisma.report.findMany({
      where: {
        status: "PENDING",
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
        createdAt: "asc",
      },
      skip,
      take: validatedQuery.limit,
    });

    const totalCount = await prisma.report.count({
      where: { status: "PENDING" },
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
      "Pending reports fetched successfully"
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

    console.error("Pending reports fetch error:", error);
    return sendError(
      "Failed to fetch pending reports",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      {
        originalError: (error as Error)?.message ?? String(error),
      }
    );
  }
}
