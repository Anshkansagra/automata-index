import type { MetadataRoute } from "next";

const BASE_URL = "https://automata-index.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
