import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/server/utils/api-response";

/**
 * Port of legacy zprofile-api.php: allzymr_profile_data()
 * GET /api/zprofile/all
 * Returns all published profiles grouped by author email.
 */
export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;

    const publishedProfiles = await prisma.wp_posts.findMany({
      where: {
        post_type: "profile-builder",
        post_status: {
          in: ["publish", "is_ready"],
        },
        author: {
          user_status: 0,
        },
      },
      select: {
        ID: true,
        post_title: true,
        post_modified: true,
        author: {
          select: {
            user_email: true,
            display_name: true,
          },
        },
      },
      orderBy: {
        post_modified: "desc",
      },
    });

    const profilesByEmail: Record<
      string,
      {
        count: number;
        profiles: Array<{ url: string; last_modified: Date }>;
      }
    > = {};

    for (const post of publishedProfiles) {
      const email = post.author?.user_email || "unknown@zymr.com";
      const profileUrl = `${origin}/profiles/${post.ID}`;

      if (!profilesByEmail[email]) {
        profilesByEmail[email] = {
          count: 0,
          profiles: [],
        };
      }

      profilesByEmail[email].count += 1;
      profilesByEmail[email].profiles.push({
        url: profileUrl,
        last_modified: post.post_modified,
      });
    }

    return successResponse({
      count: publishedProfiles.length,
      code: 200,
      data: profilesByEmail,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
