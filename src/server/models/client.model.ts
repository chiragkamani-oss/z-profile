export interface ClientModel {
  id: string;
  name: string;
  description: string;
  industry: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mapper: Translates raw WordPress CPT client & postmeta rows into a clean ClientModel.
 */
export function toClientModel(post: any): ClientModel {
  let industry = "Technology";
  let website = "";

  if (Array.isArray(post.postmeta)) {
    const indMeta = post.postmeta.find((m: any) => m.meta_key === "industry");
    if (indMeta?.meta_value) industry = indMeta.meta_value;

    const webMeta = post.postmeta.find((m: any) => m.meta_key === "website");
    if (webMeta?.meta_value) website = webMeta.meta_value;
  }

  return {
    id: post.ID?.toString() || "",
    name: post.post_title || "",
    description: post.post_content || "",
    industry,
    website: website || undefined,
    createdAt:
      post.post_date instanceof Date
        ? post.post_date.toISOString()
        : String(post.post_date || ""),
    updatedAt:
      post.post_modified instanceof Date
        ? post.post_modified.toISOString()
        : String(post.post_modified || ""),
  };
}
