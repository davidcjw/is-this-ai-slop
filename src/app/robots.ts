import type { MetadataRoute } from "next";

const SITE = "https://is-this-ai-slop.davidcjw.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The analyze API is dynamic and shouldn't be crawled.
        disallow: "/api/",
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
