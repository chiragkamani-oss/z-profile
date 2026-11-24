import { NextRequest } from "next/server";
import { UserController } from "@/server/controllers/user.controller";

export async function GET(req: NextRequest) {
  return UserController.listUsers(req);
}

export async function POST(req: NextRequest) {
  return UserController.createUser(req);
}
