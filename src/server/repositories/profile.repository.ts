import { prisma } from "@/lib/prisma";
import { CreateProfileInput, UpdateProfileInput } from "../validators/profile.schema";

export interface ProfileFilterOptions {
  authorId?: number;
  status?: string;
  search?: string;
}

const SAFE_POST_SELECT = {
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
      user_login: true,
    },
  },
} as const;

export class ProfileRepository {
  static async findMany(options: ProfileFilterOptions = {}) {
    const where: any = {
      post_type: "profile-builder",
    };

    if (options.authorId) {
      where.post_author = BigInt(options.authorId);
    }

    if (options.status) {
      where.post_status = options.status;
    }

    if (options.search) {
      where.OR = [
        { post_title: { contains: options.search } },
        { post_content: { contains: options.search } },
      ];
    }

    const posts = await prisma.wp_posts.findMany({
      where,
      orderBy: { post_date: "desc" },
      select: SAFE_POST_SELECT,
    });

    return posts;
  }

  static async findById(id: number) {
    return prisma.wp_posts.findFirst({
      where: {
        ID: BigInt(id),
        post_type: "profile-builder",
      },
      select: SAFE_POST_SELECT,
    });
  }

  static async create(authorId: number, data: CreateProfileInput) {
    const post = await prisma.wp_posts.create({
      data: {
        post_author: BigInt(authorId),
        post_title: data.title,
        post_content: data.bio || "",
        post_excerpt: data.designation,
        post_status: "in_draft",
        post_type: "profile-builder",
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
              meta_key: "profile_data",
              meta_value: JSON.stringify({
                designation: data.designation,
                experienceYears: data.experienceYears,
                skills: data.skills,
                certifications: data.certifications,
                aliasName: data.aliasName || "",
              }),
            },
            {
              meta_key: "profile_status",
              meta_value: "in_draft",
            },
          ],
        },
      },
      select: SAFE_POST_SELECT,
    });

    return post;
  }

  static async update(id: number, data: UpdateProfileInput) {
    await prisma.wp_posts.update({
      where: { ID: BigInt(id) },
      data: {
        ...(data.title ? { post_title: data.title } : {}),
        ...(data.bio !== undefined ? { post_content: data.bio } : {}),
        ...(data.designation ? { post_excerpt: data.designation } : {}),
        post_modified: new Date(),
        post_modified_gmt: new Date(),
      },
      select: SAFE_POST_SELECT,
    });

    // Update meta
    const existingMeta = await prisma.wp_postmeta.findFirst({
      where: {
        post_id: BigInt(id),
        meta_key: "profile_data",
      },
      select: {
        meta_id: true,
        meta_value: true,
      },
    });
    let currentData = {};
    if (existingMeta?.meta_value) {
      try {
        currentData = JSON.parse(existingMeta.meta_value);
      } catch {
        // Handle unparsed or legacy format
      }
    }

    const mergedData = {
      ...currentData,
      ...(data.designation ? { designation: data.designation } : {}),
      ...(data.experienceYears !== undefined
        ? { experienceYears: data.experienceYears }
        : {}),
      ...(data.skills ? { skills: data.skills } : {}),
      ...(data.certifications ? { certifications: data.certifications } : {}),
      ...(data.aliasName !== undefined ? { aliasName: data.aliasName } : {}),
    };

    if (existingMeta) {
      await prisma.wp_postmeta.update({
        where: { meta_id: existingMeta.meta_id },
        data: { meta_value: JSON.stringify(mergedData) },
      });
    } else {
      await prisma.wp_postmeta.create({
        data: {
          post_id: BigInt(id),
          meta_key: "profile_data",
          meta_value: JSON.stringify(mergedData),
        },
      });
    }

    return this.findById(id);
  }

  static async updateStatus(id: number, status: string, feedback?: string) {
    await prisma.wp_posts.update({
      where: { ID: BigInt(id) },
      data: {
        post_status: status,
        post_modified: new Date(),
        post_modified_gmt: new Date(),
      },
      select: { ID: true },
    });

    const existingMeta = await prisma.wp_postmeta.findFirst({
      where: { post_id: BigInt(id), meta_key: "profile_status" },
    });

    if (existingMeta) {
      await prisma.wp_postmeta.update({
        where: { meta_id: existingMeta.meta_id },
        data: { meta_value: status },
      });
    } else {
      await prisma.wp_postmeta.create({
        data: {
          post_id: BigInt(id),
          meta_key: "profile_status",
          meta_value: status,
        },
      });
    }

    if (feedback) {
      await prisma.wp_postmeta.create({
        data: {
          post_id: BigInt(id),
          meta_key: `feedback_${Date.now()}`,
          meta_value: feedback,
        },
      });
    }

    return this.findById(id);
  }

  static async duplicate(id: number, authorId: number) {
    const original = await prisma.wp_posts.findFirst({
      where: {
        ID: BigInt(id),
        post_type: "profile-builder",
      },
      select: SAFE_POST_SELECT,
    });

    if (!original) {
      return null;
    }

    // Version title logic matching legacy format: e.g. ver01 -> ver02
    let newTitle = original.post_title;
    const verMatch = original.post_title.match(/\bver\s*(\d+)\b/i);
    if (verMatch) {
      const currentVer = parseInt(verMatch[1], 10);
      const nextVer = currentVer + 1;
      const formattedVer =
        nextVer < 10 && verMatch[1].length >= 2 ? `0${nextVer}` : `${nextVer}`;
      newTitle = original.post_title.replace(/\bver\s*\d+\b/i, `ver${formattedVer}`);
    } else {
      newTitle = `${original.post_title} ver02`;
    }

    // Copy metadata excluding sharing logs and edit locks
    const sourceMeta = Array.isArray(original.postmeta)
      ? (original.postmeta as Array<{
          meta_key: string | null;
          meta_value: string | null;
        }>)
      : [];

    const metaToCopy = sourceMeta
      .filter(
        (m) =>
          m.meta_key && m.meta_key !== "share_with" && !m.meta_key.startsWith("_edit_")
      )
      .map((m) => {
        if (m.meta_key === "profile_status") {
          return { meta_key: "profile_status", meta_value: "in_draft" };
        }
        return { meta_key: m.meta_key, meta_value: m.meta_value };
      });

    if (!metaToCopy.some((m) => m.meta_key === "profile_status")) {
      metaToCopy.push({ meta_key: "profile_status", meta_value: "in_draft" });
    }

    const duplicated = await prisma.wp_posts.create({
      data: {
        post_author: BigInt(authorId),
        post_title: newTitle,
        post_content: original.post_content,
        post_excerpt: original.post_excerpt,
        post_status: "in_draft",
        post_type: "profile-builder",
        post_date: new Date(),
        post_date_gmt: new Date(),
        post_modified: new Date(),
        post_modified_gmt: new Date(),
        to_ping: "",
        pinged: "",
        post_content_filtered: "",
        postmeta: {
          create: metaToCopy,
        },
      },
      select: SAFE_POST_SELECT,
    });

    return duplicated;
  }

  static async delete(id: number) {
    const postBigId = BigInt(id);

    // 1. Delete associated meta entries for this post
    await prisma.wp_postmeta.deleteMany({
      where: { post_id: postBigId },
    });

    // 2. Delete the main post
    return prisma.wp_posts.delete({
      where: { ID: postBigId },
      select: { ID: true },
    });
  }
}
