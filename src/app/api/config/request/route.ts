import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmailService } from "@/server/services/email.service";
import { successResponse, errorResponse } from "@/server/utils/api-response";
import { UnauthorizedError, BadRequestError } from "@/server/utils/errors";
import { z } from "zod";

const requestConfigSchema = z.object({
  section: z.string().min(1, "Section name is required"),
  requestedData: z.string().min(1, "Requested metadata is required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const body = await req.json();
    const validated = requestConfigSchema.parse(body);

    await EmailService.sendMissingConfigNotification({
      employeeName: session.user.name || session.user.email || "Zymrian Engineer",
      employeeEmail: session.user.email || "engineer@zymr.com",
      section: validated.section,
      requestedData: validated.requestedData,
    });

    return successResponse({
      message: "Notification sent successfully to platform administrator.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
