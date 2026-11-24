import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ClientService } from "../services/client.service";
import { createClientSchema, updateClientSchema } from "../validators/client.schema";
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

  static async getClientById(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await this.getSessionUser();
      const { id } = await params;
      const client = await ClientService.getClientById(parseInt(id, 10), user);
      return successResponse(client);
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

  static async updateClient(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await this.getSessionUser();
      const { id } = await params;
      const body = await req.json();
      const validatedData = updateClientSchema.parse(body);

      const client = await ClientService.updateClient(
        parseInt(id, 10),
        validatedData,
        user
      );
      return successResponse(client);
    } catch (error) {
      return errorResponse(error);
    }
  }

  static async deleteClient(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await this.getSessionUser();
      const { id } = await params;
      const result = await ClientService.deleteClient(parseInt(id, 10), user);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
