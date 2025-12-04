// scripts/sync-volunteers.ts
import { prisma } from "../src/lib/prisma";
import { assignmentManager } from "../src/lib/assignment/redisManager";
import { Redis } from "ioredis";

async function syncVolunteersToRedis() {
  try {
    console.log("🔄 Starting volunteer sync...\n");

    // Get all volunteers from database
    const volunteers = await prisma.user.findMany({
      where: {
        role: "volunteer",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📊 Found ${volunteers.length} volunteers in database:`);
    volunteers.forEach((v) => {
      console.log(`   - ${v.name} (${v.email}) - ID: ${v.id}`);
    });

    if (volunteers.length === 0) {
      console.log("\n⚠️  No volunteers found!");
      return;
    }

    // Clear Redis manually
    console.log("\n🗑️  Clearing old Redis data...");
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    await redis.del("volunteer:workload");

    // Clear all volunteer metadata and reports
    const keys = await redis.keys("volunteer:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.quit();

    // Add volunteers to Redis using registerVolunteer
    console.log("📥 Adding volunteers to Redis...\n");
    for (const volunteer of volunteers) {
      await assignmentManager.registerVolunteer(volunteer.id, 100);
      console.log(`   ✅ Added: ${volunteer.name}`);
    }

    console.log(`\n✅ Successfully synced ${volunteers.length} volunteers!`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

syncVolunteersToRedis();
