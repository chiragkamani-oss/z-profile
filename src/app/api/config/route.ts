import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ConfigService } from "@/server/services/config.service";
import { successResponse, errorResponse } from "@/server/utils/api-response";
import { UnauthorizedError, ForbiddenError } from "@/server/utils/errors";

export async function GET() {
  try {
    const config = await ConfigService.getConfig();
    return successResponse(config);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError();
    }

    const user = session.user as { role: string };
    if (user.role !== "administrator") {
      throw new ForbiddenError("Only Administrators can modify master taxonomies");
    }

    const body = await req.json();
    const updated = await ConfigService.updateConfig(body);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
