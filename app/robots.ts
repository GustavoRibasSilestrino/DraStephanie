import type { MetadataRoute } from "next";
import { DEMO } from "@/lib/demo";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (DEMO) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/meu-agendamento"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
