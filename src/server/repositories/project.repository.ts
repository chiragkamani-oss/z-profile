import { prisma } from "@/lib/prisma";
import { CreateProjectInput, UpdateProjectInput } from "../validators/project.schema";

const SAFE_PROJECT_SELECT = {
  ID: true,
  post_author: true,
  post_date: true,
  post_content: true,
  post_title: true,
  post_excerpt: true,
  post_status: true,
  post_modified: true,
  post_type: true,
  postmeta: true,
  author: {
    select: {
      ID: true,
      display_name: true,
      user_email: true,
    },
  },
} as const;

export class ProjectRepository {
  static async findMany(options: { clientId?: number; authorId?: number } = {}) {
    const where: any = {
      post_type: "projects",
    };

    if (options.authorId) {
      where.post_author = BigInt(options.authorId);
    }

    const projects = await prisma.wp_posts.findMany({
      where,
      orderBy: { post_date: "desc" },
      select: SAFE_PROJECT_SELECT,
    });

    if (options.clientId) {
      const targetClientIdStr = options.clientId.toString();
      return projects.filter((p) =>
        p.postmeta.some(
          (m) =>
            (m.meta_key === "client" || m.meta_key === "_client_id") &&
            m.meta_value === targetClientIdStr
        )
      );
    }

    return projects;
  }

  static async findById(id: number) {
    return prisma.wp_posts.findFirst({
      where: {
        ID: BigInt(id),
        post_type: "projects",
      },
      select: SAFE_PROJECT_SELECT,
    });
  }

  static async create(authorId: number, data: CreateProjectInput) {
    const projectDataObj = {
      project_name: data.name,
      alias_name: data.alias_name || "",
      client_id: data.clientId ? data.clientId.toString() : "",
      type: data.type || "",
      category: data.category || "",
      cloud: data.cloud || "",
      solution: data.solution || "",
      architecture: data.architecture || "",
      responsibilities: Array.isArray(data.responsibilities)
        ? data.responsibilities
        : [data.responsibilities].filter(Boolean),
      contributions: Array.isArray(data.contributions)
        ? data.contributions
        : [data.contributions].filter(Boolean),
      toolprocesses: data.toolprocesses || "",
    };

    const post = await prisma.wp_posts.create({
      data: {
        post_author: BigInt(authorId),
        post_title: data.name,
        post_content: data.solution || "",
        post_excerpt: data.alias_name || "",
        post_status: "publish",
        post_type: "projects",
        post_date: new Date(),
        post_date_gmt: new Date(),
        post_modified: new Date(),
        post_modified_gmt: new Date(),
        to_ping: "",
        pinged: "",
        post_content_filtered: "",
        postmeta: {
          create: [
            {
              meta_key: "projects",
              meta_value: JSON.stringify(projectDataObj),
            },
            ...(data.clientId
              ? [
                  {
                    meta_key: "client",
                    meta_value: data.clientId.toString(),
                  },
                ]
              : []),
          ],
        },
      },
      select: SAFE_PROJECT_SELECT,
    });

    return post;
  }

  static async update(id: number, data: UpdateProjectInput) {
    await prisma.wp_posts.update({
      where: { ID: BigInt(id) },
      data: {
        ...(data.name ? { post_title: data.name } : {}),
        ...(data.solution !== undefined ? { post_content: data.solution } : {}),
        ...(data.alias_name !== undefined ? { post_excerpt: data.alias_name } : {}),
        post_modified: new Date(),
        post_modified_gmt: new Date(),
      },
      select: { ID: true },
    });

    const existingMeta = await prisma.wp_postmeta.findFirst({
      where: { post_id: BigInt(id), meta_key: "projects" },
    });

    let current = {};
    if (existingMeta?.meta_value) {
      try {
        current = JSON.parse(existingMeta.meta_value);
      } catch {
        current = {};
      }
    }

    const merged = {
      ...current,
      ...(data.name ? { project_name: data.name } : {}),
      ...(data.alias_name !== undefined ? { alias_name: data.alias_name } : {}),
      ...(data.clientId !== undefined ? { client_id: data.clientId.toString() } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.cloud !== undefined ? { cloud: data.cloud } : {}),
      ...(data.solution !== undefined ? { solution: data.solution } : {}),
      ...(data.architecture !== undefined ? { architecture: data.architecture } : {}),
      ...(data.responsibilities !== undefined
        ? {
            responsibilities: Array.isArray(data.responsibilities)
              ? data.responsibilities
              : [data.responsibilities].filter(Boolean),
          }
        : {}),
      ...(data.contributions !== undefined
        ? {
            contributions: Array.isArray(data.contributions)
              ? data.contributions
              : [data.contributions].filter(Boolean),
          }
        : {}),
      ...(data.toolprocesses !== undefined ? { toolprocesses: data.toolprocesses } : {}),
    };

    if (existingMeta) {
      await prisma.wp_postmeta.update({
        where: { meta_id: existingMeta.meta_id },
        data: { meta_value: JSON.stringify(merged) },
      });
    } else {
      await prisma.wp_postmeta.create({
        data: {
          post_id: BigInt(id),
          meta_key: "projects",
          meta_value: JSON.stringify(merged),
        },
      });
    }

    if (data.clientId !== undefined) {
      const clientMeta = await prisma.wp_postmeta.findFirst({
        where: { post_id: BigInt(id), meta_key: "client" },
      });
      if (clientMeta) {
        await prisma.wp_postmeta.update({
          where: { meta_id: clientMeta.meta_id },
          data: { meta_value: data.clientId.toString() },
        });
      } else {
        await prisma.wp_postmeta.create({
          data: {
            post_id: BigInt(id),
            meta_key: "client",
            meta_value: data.clientId.toString(),
          },
        });
      }
    }

    return this.findById(id);
  }

  static async delete(id: number) {
    await prisma.wp_postmeta.deleteMany({
      where: { post_id: BigInt(id) },
    });

    return prisma.wp_posts.delete({
      where: { ID: BigInt(id) },
      select: { ID: true },
    });
  }
}
