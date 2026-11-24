import { NextRequest } from "next/server";
import { ProjectController } from "@/server/controllers/project.controller";

export async function GET(req: NextRequest) {
  return ProjectController.listProjects(req);
}

export async function POST(req: NextRequest) {
  return ProjectController.createProject(req);
}
