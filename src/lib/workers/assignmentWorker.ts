// ============================================
// FILE: src/lib/workers/assignmentWorker.ts
// ============================================

import { prisma } from "@/lib/prisma";
import { assignmentManager } from "../assignment/redisManager";
import { realtimeEmitter } from "../realtime/eventEmitter";

const NUM_VERIFIERS_PER_REPORT = 1;

interface AssignmentResult {
  success: boolean;
  assigned: string[];
  message?: string;
}

export async function assignReportToVolunteers(
  reportId: string
): Promise<AssignmentResult> {
  try {
    console.log(`\n🔄 Starting assignment for report ${reportId}`);

    // 1. Get report details
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        assignedCount: true,
        status: true,
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    if (report.status !== "PENDING") {
      console.log(`⚠️  Report ${reportId} is already ${report.status}`);
      return { success: false, assigned: [], message: "Report not pending" };
    }

    // 2. Get existing assignments from DB
    const existingAssignments = await prisma.assignment.findMany({
      where: { reportId },
      select: { volunteerId: true },
    });

    const alreadyAssigned = existingAssignments.map((a) => a.volunteerId);

    if (alreadyAssigned.length >= NUM_VERIFIERS_PER_REPORT) {
      console.log(
        `✅ Report ${reportId} already has ${alreadyAssigned.length} volunteers`
      );
      return {
        success: true,
        assigned: alreadyAssigned,
        message: "Already assigned",
      };
    }

    // 3. Select volunteers from Redis
    const needed = NUM_VERIFIERS_PER_REPORT - alreadyAssigned.length;
    const selectedIds = await assignmentManager.selectVolunteers(
      needed,
      alreadyAssigned
    );

    if (selectedIds.length === 0) {
      console.warn(`⚠️  No volunteers available for report ${reportId}`);
      return {
        success: false,
        assigned: [],
        message: "No volunteers available",
      };
    }

    console.log(
      `👥 Selected ${selectedIds.length} volunteers from Redis: ${selectedIds.join(", ")}`
    );

    // 4. VALIDATE volunteers exist in database
    const validVolunteers = await prisma.user.findMany({
      where: {
        id: { in: selectedIds },
        role: "volunteer",
      },
      select: { id: true },
    });

    const validVolunteerIds = validVolunteers.map((v) => v.id);

    const invalidIds = selectedIds.filter(
      (id) => !validVolunteerIds.includes(id)
    );

    if (invalidIds.length > 0) {
      console.warn(
        `⚠️  Found ${invalidIds.length} invalid volunteer IDs in Redis: ${invalidIds.join(", ")}`
      );
      console.warn(`⚠️  Run: npx tsx scripts/sync-volunteers.ts to fix Redis`);
    }

    if (validVolunteerIds.length === 0) {
      console.error(`❌ None of the selected volunteers exist in database`);
      console.error(
        `❌ Run: npx tsx scripts/sync-volunteers.ts to sync Redis with DB`
      );
      return {
        success: false,
        assigned: [],
        message: "Selected volunteers not found. Redis needs sync.",
      };
    }

    console.log(
      `✅ Validated ${validVolunteerIds.length} volunteers exist in DB`
    );

    // 5. Create assignment records (only for valid volunteers)
    const created = await prisma.assignment.createMany({
      data: validVolunteerIds.map((volunteerId) => ({
        reportId,
        volunteerId,
        status: "PENDING",
      })),
      skipDuplicates: true,
    });

    console.log(`💾 Created ${created.count} new assignment records in DB`);

    // 6. Update Redis tracking
    await assignmentManager.assignReport(reportId, validVolunteerIds);

    // 7. Update report assignment count
    await prisma.report.update({
      where: { id: reportId },
      data: {
        assignedCount: alreadyAssigned.length + validVolunteerIds.length,
      },
    });

    // 8. Send real-time notifications
    for (const volunteerId of validVolunteerIds) {
      realtimeEmitter.notifyNewAssignment(volunteerId, reportId);
    }

    console.log(
      `✅ Successfully assigned report ${reportId} to ${validVolunteerIds.length} volunteers\n`
    );

    return { success: true, assigned: validVolunteerIds };
  } catch (error) {
    console.error(`❌ Assignment error for report ${reportId}:`, error);
    return {
      success: false,
      assigned: [],
      message: error instanceof Error ? error.message : "Assignment failed",
    };
  }
}
