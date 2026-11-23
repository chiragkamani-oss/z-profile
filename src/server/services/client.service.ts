import { prisma } from "@/lib/prisma";
import { CreateClientInput, UpdateClientInput } from "../validators/client.schema";
import { CurrentUser } from "./profile.service";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { serializeBigInt } from "@/lib/utils";

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
      include: {
        postmeta: true,
      },
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
        post_modified: new Date(),
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
      include: { postmeta: true },
    });

    return serializeBigInt(client);
  }
}
