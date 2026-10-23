import type { MetadataRoute } from "next";
import { DEMO } from "@/lib/demo";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (DEMO) return []; // proposta: não divulgar nada aos buscadores
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/agendar`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
