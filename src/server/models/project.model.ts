export interface ProjectMetadata {
  projectName?: string;
  aliasName?: string;
  clientId?: string;
  type?: string;
  category?: string;
  cloud?: string;
  solution?: string;
  architecture?: string;
  responsibilities: string[];
  contributions: string[];
  toolprocesses?: string;
}

export interface ProjectModel {
  id: string;
  authorId: string;
  name: string;
  aliasName: string;
  clientId?: string;
  type: string;
  category: string;
  cloud: string;
  solution: string;
  architecture: string;
  responsibilities: string[];
  contributions: string[];
  toolprocesses: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
  };
}

/**
 * Mapper: Translates raw WordPress CPT project & postmeta rows into a clean ProjectModel.
 */
export function toProjectModel(post: any): ProjectModel {
  let parsedMeta: Record<string, any> = {};

  if (Array.isArray(post.postmeta)) {
    const metaItem = post.postmeta.find((m: any) => m.meta_key === "projects");
    if (metaItem?.meta_value) {
      try {
        parsedMeta = JSON.parse(metaItem.meta_value);
      } catch {
        // Fallback for legacy format
      }
    }
  }

  // Look for client id in specific meta key or inside project payload
  let clientId = parsedMeta.client_id;
  if (!clientId && Array.isArray(post.postmeta)) {
    const clientMeta = post.postmeta.find(
      (m: any) => m.meta_key === "client" || m.meta_key === "_client_id"
    );
    if (clientMeta?.meta_value) {
      clientId = clientMeta.meta_value;
    }
  }

  return {
    id: post.ID?.toString() || "",
    authorId: post.post_author?.toString() || "",
    name: post.post_title || parsedMeta.project_name || "",
    aliasName: parsedMeta.alias_name || post.post_excerpt || "",
    clientId: clientId ? String(clientId) : undefined,
    type: parsedMeta.type || "Web Application",
    category: parsedMeta.category || "Cloud Native",
    cloud: parsedMeta.cloud || "AWS",
    solution: parsedMeta.solution || post.post_content || "",
    architecture: parsedMeta.architecture || "",
    responsibilities: Array.isArray(parsedMeta.responsibilities)
      ? parsedMeta.responsibilities
      : parsedMeta.responsibilities
        ? [parsedMeta.responsibilities]
        : [],
    contributions: Array.isArray(parsedMeta.contributions)
      ? parsedMeta.contributions
      : parsedMeta.contributions
        ? [parsedMeta.contributions]
        : [],
    toolprocesses: parsedMeta.toolprocesses || "",
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
        }
      : undefined,
  };
}
