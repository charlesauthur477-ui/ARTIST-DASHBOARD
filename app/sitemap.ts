import type { MetadataRoute } from "next";
import { getAllArtists } from "@/lib/artists";

const SUB_ROUTES = ["", "/about", "/music", "/shows", "/gallery", "/band", "/press", "/booking", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://wavelength-artists-demo.vercel.app";
  const artists = await getAllArtists();

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/apply`, changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const artist of artists) {
    for (const sub of SUB_ROUTES) {
      entries.push({
        url: `${base}/artists/${artist.slug}${sub}`,
        changeFrequency: sub === "" ? "weekly" : "monthly",
        priority: sub === "" ? 0.9 : 0.6,
      });
    }
  }

  return entries;
}
