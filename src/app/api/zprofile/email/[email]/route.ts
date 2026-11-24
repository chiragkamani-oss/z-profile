import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/server/utils/api-response";
import { BadRequestError, NotFoundError } from "@/server/utils/errors";

/**
 * Port of legacy zprofile-api.php: zymr_profile($email)
 * GET /api/zprofile/email/[email]
 * Returns profile title, url, and last modified date for a specific user email.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const trimmedEmail = decodeURIComponent(email).trim();

    const emailSchema = z.string().email();
    if (!emailSchema.safeParse(trimmedEmail).success) {
      throw new BadRequestError("Please check your email address format");
    }

    const user = await prisma.wp_users.findFirst({
      where: {
        user_email: trimmedEmail,
      },
      select: {
        ID: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Record not found for given email");
    }

    const origin = req.nextUrl.origin;
    const profiles = await prisma.wp_posts.findMany({
      where: {
        post_author: user.ID,
        post_type: "profile-builder",
      },
      select: {
        ID: true,
        post_title: true,
        post_modified: true,
      },
      orderBy: {
        post_modified: "desc",
      },
    });

    const formattedData = profiles.map((p) => ({
      id: p.ID.toString(),
      title: p.post_title,
      url: `${origin}/profiles/${p.ID}`,
      last_modified: p.post_modified,
    }));

    return successResponse({
      code: 200,
      data: formattedData,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
