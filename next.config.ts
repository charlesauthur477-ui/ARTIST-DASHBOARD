import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Uploaded artist media (profile/hero/gallery/press photos, video posters,
// etc.) is stored in Vercel Blob and served from a per-project subdomain of
// public.blob.vercel-storage.com (see lib/media.ts — blobUrl comes straight
// from @vercel/blob's put()). next/image refuses to optimize any remote host
// that isn't explicitly allow-listed, so without this every real (DB-backed)
// artist's photos would fail to render in production — the two bundled demo
// artists (Aurora Noir, Nova Vale) use local /public/artists/... paths and
// were masking this. The store subdomain varies per Blob store, so a
// wildcard is required rather than one fixed hostname.
// ---------------------------------------------------------------------------
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
