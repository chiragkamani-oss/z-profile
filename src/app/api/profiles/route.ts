import { NextRequest } from "next/server";
import { ProfileController } from "@/server/controllers/profile.controller";

export async function GET(req: NextRequest) {
  return ProfileController.listProfiles(req);
}

export async function POST(req: NextRequest) {
  return ProfileController.createProfile(req);
}
