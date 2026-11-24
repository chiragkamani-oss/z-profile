import { prisma } from "@/lib/prisma";
import { CreateClientInput, UpdateClientInput } from "../validators/client.schema";
import { CurrentUser } from "./profile.service";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { serializeBigInt } from "@/lib/utils";

const SAFE_CLIENT_SELECT = {
  ID: true,
  post_author: true,
  post_date: true,
  post_content: true,
  post_title: true,
  post_excerpt: true,
  post_status: true,
  comment_status: true,
  ping_status: true,
  post_password: true,
  post_name: true,
  to_ping: true,
  pinged: true,
  post_modified: true,
  post_content_filtered: true,
  post_parent: true,
  guid: true,
  menu_order: true,
  post_type: true,
  post_mime_type: true,
  comment_count: true,
  postmeta: true,
} as const;

export class ClientService {
  /**
   * List clients.
   * If user is an engineer, only returns clients created by that engineer.
   */
  static async listClients(currentUser: CurrentUser) {
    const isEngineer = currentUser.role === "engineer";

    const clients = await prisma.wp_posts.findMany({
      where: {
        post_type: "client",
        ...(isEngineer ? { post_author: BigInt(currentUser.id) } : {}),
      },
      orderBy: { post_title: "asc" },
      select: SAFE_CLIENT_SELECT,
    });

    return serializeBigInt(clients);
  }

  /**
   * Create a new client entry.
   */
  static async createClient(data: CreateClientInput, currentUser: CurrentUser) {
    const client = await prisma.wp_posts.create({
      data: {
        post_author: BigInt(currentUser.id),
        post_title: data.name,
        post_content: data.description || "",
        post_excerpt: "",
        post_status: "publish",
        post_type: "client",
        post_date: new Date(),
        post_date_gmt: new Date(),
        post_modified: new Date(),
        post_modified_gmt: new Date(),
        to_ping: "",
        pinged: "",
        post_content_filtered: "",
        postmeta: {
          create: [
            { meta_key: "industry", meta_value: data.industry || "" },
            { meta_key: "website", meta_value: data.website || "" },
          ],
        },
      },
      select: SAFE_CLIENT_SELECT,
    });

    return serializeBigInt(client);
  }
}
