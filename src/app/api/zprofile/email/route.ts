import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/server/utils/api-response";

/**
 * Port of legacy profiles-api.php: zymr_profile_data()
 * GET /api/zprofile/email
 * Returns user profile counts by user email.
 */
export async function GET() {
  try {
    const users = await prisma.wp_users.findMany({
      where: {
        user_status: 0,
      },
      select: {
        ID: true,
        user_email: true,
        display_name: true,
      },
    });

    const userIds = users.map((u) => u.ID);
    const postCounts = await prisma.wp_posts.groupBy({
      by: ["post_author"],
      where: {
        post_author: { in: userIds },
        post_type: "profile-builder",
      },
      _count: {
        _all: true,
      },
    });

    const countMap = new Map<string, number>();
    for (const count of postCounts) {
      countMap.set(count.post_author.toString(), count._count._all);
    }

    const data = users.map((user) => ({
      email: user.user_email,
      name: user.display_name,
      profile: countMap.get(user.ID.toString()) || 0,
    }));

    return successResponse({
      code: 200,
      data,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
