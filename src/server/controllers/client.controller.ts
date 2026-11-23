import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ClientService } from "../services/client.service";
import { createClientSchema } from "../validators/client.schema";
import { successResponse, errorResponse } from "../utils/api-response";
import { UnauthorizedError } from "../utils/errors";
import { CurrentUser } from "../services/profile.service";

export class ClientController {
  private static async getSessionUser(): Promise<CurrentUser> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError("Authentication required");
    }
    return session.user as CurrentUser;
  }

  static async listClients(req: NextRequest) {
    try {
      const user = await this.getSessionUser();
      const clients = await ClientService.listClients(user);
      return successResponse(clients);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async createClient(req: NextRequest) {
    try {
      const user = await this.getSessionUser();
      const body = await req.json();
      const validatedData = createClientSchema.parse(body);

      const client = await ClientService.createClient(validatedData, user);
      return successResponse(client, 201);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
