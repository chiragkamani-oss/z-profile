import { NextRequest } from "next/server";
import { ClientController } from "@/server/controllers/client.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ClientController.getClientById(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ClientController.updateClient(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ClientController.deleteClient(req, context);
}
