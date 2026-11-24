import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileId = BigInt(id);

    const shareMeta = await prisma.wp_postmeta.findFirst({
      where: {
        post_id: profileId,
        meta_key: "share_with",
      },
    });

    let shares: Array<{ company_name: string; share_by: string; date: string }> = [];
    if (shareMeta?.meta_value) {
      try {
        shares = JSON.parse(shareMeta.meta_value);
      } catch {
        // Fallback or empty
      }
    }

    return successResponse(shares);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError("Authentication required to log client shares");
    }

    const { id } = await params;
    const profileId = BigInt(id);
    const body = await req.json();

    const companyName = body.companyName?.trim();
    if (!companyName) {
      return errorResponse(new Error("Company or client name is required"), 400);
    }

    const shareBy = session.user.name || session.user.email || "Team Member";
    const date = body.date || new Date().toISOString().split("T")[0];

    const existingMeta = await prisma.wp_postmeta.findFirst({
      where: {
        post_id: profileId,
        meta_key: "share_with",
      },
    });

    let shares: Array<{ company_name: string; share_by: string; date: string }> = [];
    if (existingMeta?.meta_value) {
      try {
        shares = JSON.parse(existingMeta.meta_value);
      } catch {
        shares = [];
      }
    }

    shares.unshift({
      company_name: companyName,
      share_by: shareBy,
      date,
    });

    if (existingMeta) {
      await prisma.wp_postmeta.update({
        where: { meta_id: existingMeta.meta_id },
        data: { meta_value: JSON.stringify(shares) },
      });
    } else {
      await prisma.wp_postmeta.create({
        data: {
          post_id: profileId,
          meta_key: "share_with",
          meta_value: JSON.stringify(shares),
        },
      });
    }

    return successResponse(shares);
  } catch (error) {
    return errorResponse(error);
  }
}
