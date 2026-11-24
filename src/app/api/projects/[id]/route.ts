import { NextRequest } from "next/server";
import { ProjectController } from "@/server/controllers/project.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ProjectController.getProjectById(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ProjectController.updateProject(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ProjectController.deleteProject(req, context);
}
