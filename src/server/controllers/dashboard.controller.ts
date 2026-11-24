import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "../utils/api-response";
import { UnauthorizedError } from "../utils/errors";
import { serializeBigInt } from "@/lib/utils";

export class DashboardController {
  static async getStats(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const user = session.user as { id: string; role: string };
      const isRestricted = user.role === "engineer" || user.role === "partner";
      const authorFilter = isRestricted ? { post_author: BigInt(user.id) } : {};

      // 1. Query Profile Status Counts
      const allProfiles = await prisma.wp_posts.findMany({
        where: {
          post_type: "profile-builder",
          ...authorFilter,
        },
        select: {
          ID: true,
          post_title: true,
          post_status: true,
          post_excerpt: true,
          post_date: true,
          postmeta: {
            where: { meta_key: "profile_data" },
            select: { meta_value: true },
          },
          author: {
            select: {
              display_name: true,
              user_email: true,
            },
          },
        },
        orderBy: { post_date: "desc" },
      });

      const totalProfiles = allProfiles.length;
      let readyCount = 0;
      let inReviewCount = 0;
      let reviewChangesCount = 0;
      let draftCount = 0;

      const skillCounts: Record<string, number> = {};

      allProfiles.forEach((p) => {
        const s = p.post_status;
        if (s === "is_ready" || s === "publish") readyCount++;
        else if (s === "in_review") inReviewCount++;
        else if (s === "review_changes") reviewChangesCount++;
        else draftCount++;

        // Parse skills from meta
        const metaVal = p.postmeta?.[0]?.meta_value;
        if (metaVal) {
          try {
            const parsed = JSON.parse(metaVal);
            if (Array.isArray(parsed.skills)) {
              parsed.skills.forEach((skill: string) => {
                const trimmed = skill.trim();
                if (trimmed) {
                  skillCounts[trimmed] = (skillCounts[trimmed] || 0) + 1;
                }
              });
            }
          } catch {
            // Ignore legacy unparsed formats
          }
        }
      });

      // Top 8 skills by frequency
      const topSkills = Object.entries(skillCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Total clients count
      const clientCount = await prisma.wp_posts.count({
        where: { post_type: "client" },
      });

      // Total users count (for admin)
      const userCount = await prisma.wp_users.count();

      // Recent 5 profiles
      const recentProfiles = allProfiles.slice(0, 5).map((p) => ({
        id: p.ID.toString(),
        title: p.post_title,
        designation: p.post_excerpt || "Software Engineer",
        status: p.post_status,
        date: p.post_date,
        authorName: p.author?.display_name || "Unknown",
        authorEmail: p.author?.user_email || "",
      }));

      const payload = {
        totalProfiles,
        readyCount,
        inReviewCount,
        reviewChangesCount,
        draftCount,
        clientCount,
        userCount,
        topSkills,
        recentProfiles,
      };

      return successResponse(serializeBigInt(payload));
    } catch (error) {
      return errorResponse(error);
    }
  }
}
