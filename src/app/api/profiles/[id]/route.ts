import { NextRequest } from "next/server";
import { ProfileController } from "@/server/controllers/profile.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return ProfileController.getProfileById(req, { params: resolvedParams });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return ProfileController.updateProfile(req, { params: resolvedParams });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return ProfileController.deleteProfile(req, { params: resolvedParams });
}
