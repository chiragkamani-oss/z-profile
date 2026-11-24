import { NextRequest } from "next/server";
import { DashboardController } from "@/server/controllers/dashboard.controller";

export async function GET(req: NextRequest) {
  return DashboardController.getStats(req);
}
