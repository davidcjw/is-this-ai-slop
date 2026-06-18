import type { MetadataRoute } from "next";

const SITE = "https://is-this-ai-slop.davidcjw.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
