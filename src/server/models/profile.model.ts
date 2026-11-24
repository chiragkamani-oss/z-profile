export type ProfileStatus =
  "in_draft" | "in_review" | "review_changes" | "is_ready" | "publish";

export interface ProfileMetadata {
  designation?: string;
  experienceYears?: number;
  skills: string[];
  certifications: string[];
  aliasName?: string;
}

export interface ProfileShareRecord {
  companyName: string;
  sharedBy: string;
  sharedDate: string;
}

export interface ProfileModel {
  id: string;
  authorId: string;
  title: string;
  designation: string;
  bio: string;
  status: ProfileStatus;
  aliasName?: string;
  experienceYears: number;
  skills: string[];
  certifications: string[];
  shares?: ProfileShareRecord[];
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
    username: string;
  };
}

/**
 * Mapper: Translates raw WordPress CPT post & postmeta rows into a clean ProfileModel.
 */
export function toProfileModel(post: any): ProfileModel {
  let parsedMeta: ProfileMetadata = {
    skills: [],
    certifications: [],
  };

  if (Array.isArray(post.postmeta)) {
    const dataMeta = post.postmeta.find((m: any) => m.meta_key === "profile_data");
    if (dataMeta?.meta_value) {
      try {
        parsedMeta = JSON.parse(dataMeta.meta_value);
      } catch {
        // Fallback for non-JSON legacy data
      }
    }
  }

  return {
    id: post.ID?.toString() || "",
    authorId: post.post_author?.toString() || "",
    title: post.post_title || "",
    designation: parsedMeta.designation || post.post_excerpt || "Software Engineer",
    bio: post.post_content || "",
    status: (post.post_status as ProfileStatus) || "in_draft",
    aliasName: parsedMeta.aliasName || undefined,
    experienceYears: parsedMeta.experienceYears ?? 0,
    skills: Array.isArray(parsedMeta.skills) ? parsedMeta.skills : [],
    certifications: Array.isArray(parsedMeta.certifications)
      ? parsedMeta.certifications
      : [],
    createdAt:
      post.post_date instanceof Date
        ? post.post_date.toISOString()
        : String(post.post_date || ""),
    updatedAt:
      post.post_modified instanceof Date
        ? post.post_modified.toISOString()
        : String(post.post_modified || ""),
    author: post.author
      ? {
          id: post.author.ID?.toString() || post.post_author?.toString() || "",
          displayName: post.author.display_name || "",
          email: post.author.user_email || "",
          username: post.author.user_login || "",
        }
      : undefined,
  };
}
