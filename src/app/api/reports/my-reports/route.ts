// src/app/api/reports/my-reports/route.ts

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { success, user } = verifyToken(req);
    if (!success || !user) {
      return sendError("Unauthorized", "AUTH_ERROR", 401);
    }

    // Check if the request wants all reports or just recent ones
    const url = new URL(req.url);
    const allReports = url.searchParams.get("all") === "true";

    const reports = await prisma.report.findMany({
      where: { reporterId: String(user.id) },
      orderBy: { createdAt: "desc" },
      ...(allReports ? {} : { take: 10 }), // Only limit to 10 if not requesting all
      include: {
        images: true, // Include associated images
      },
    });

    return sendSuccess(reports);
  } catch (error) {
    console.error("Fetch reports error:", error);
    return sendError("Failed to fetch reports", "DB_ERROR", 500);
  }
}
