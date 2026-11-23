import { NextRequest } from "next/server";
import { ProfileController } from "@/server/controllers/profile.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return ProfileController.updateStatus(req, { params: resolvedParams });
}
