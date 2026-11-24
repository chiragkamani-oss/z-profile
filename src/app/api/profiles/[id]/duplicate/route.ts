import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileService, CurrentUser } from "@/server/services/profile.service";
import { successResponse, errorResponse } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError();
    }

    const { id } = await params;
    const profile = await ProfileService.duplicateProfile(
      Number.parseInt(id, 10),
      session.user as CurrentUser
    );

    return successResponse(profile, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
