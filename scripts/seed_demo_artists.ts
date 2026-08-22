// ---------------------------------------------------------------------------
// Seeds the database with the two existing demo artists (Aurora Noir, Nova
// Vale) from their current static data in /data/artists — see
// PHASE_3_PLAN.md Section 9 ("Migration strategy") for why this exists: it
// proves the insert -> media -> publish pipeline end-to-end using real data
// before any real applicant goes through it, and produces database-backed
// versions of the two demo artists that should render identically to the
// static versions (verify with a visual diff before flipping USE_DATABASE
// on in production — see the "Testing" section of the Phase 3 report).
//
// Every local image referenced by the static demo data (public/artists/**)
// is uploaded to Vercel Blob for real — nothing here is a shortcut that
// leaves the seeded artists pointing at local file paths.
//
// Run with: npm run db:seed
// Requires DATABASE_URL and BLOB_READ_WRITE_TOKEN to be set.
// ---------------------------------------------------------------------------

import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@/db/schema";
import { artists as staticArtists } from "@/data/artists";
import type { Artist } from "@/types/artist";

const PUBLIC_DIR = path.join(process.cwd(), "public");

function mimeTypeFor(filePath: string): string {
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

interface UploadedImage {
  url: string;
  sizeBytes: number;
}

async function uploadLocalImage(
  publicPath: string,
  ownerId: string,
  role: (typeof schema.mediaRoleEnum.enumValues)[number]
): Promise<UploadedImage | null> {
  if (!publicPath) return null;
  const absolute = path.join(PUBLIC_DIR, publicPath.replace(/^\//, ""));
  let buffer: Buffer;
  try {
    buffer = await readFile(absolute);
  } catch {
    console.warn(`  ! missing local file, skipping: ${publicPath}`);
    return null;
  }

  const fileName = path.basename(publicPath);
  const pathname = `artists/${ownerId}/${role}/${crypto.randomUUID()}-${fileName}`;
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: mimeTypeFor(publicPath),
    addRandomSuffix: false,
  });

  return { url: blob.url, sizeBytes: buffer.byteLength };
}

async function seedArtist(db: ReturnType<typeof drizzle>, artist: Artist) {
  console.log(`Seeding ${artist.name} (${artist.slug})...`);

  const [row] = await db
    .insert(schema.artists)
    .values({
      slug: artist.slug,
      status: "active",
      name: artist.name,
      stageName: artist.stageName,
      tagline: artist.tagline,
      genre: artist.genre,
      location: artist.location,
      bio: artist.bio,
      shortBio: artist.shortBio,
      careerHighlights: artist.careerHighlights,
      socialLinks: artist.socialLinks,
      streamingLinks: artist.streamingLinks,
      instagramHandle: artist.instagramHandle ?? null,
      pressKit: { bio: artist.pressKit.bio, shortBio: artist.pressKit.shortBio, downloadUrl: artist.pressKit.downloadUrl },
      bookingSettings: artist.bookingSettings,
      contactInformation: artist.contactInformation,
      publishedAt: new Date(),
    })
    .returning();

  const artistId = row.id;

  async function insertMediaFor(
    uploaded: UploadedImage | null,
    role: (typeof schema.mediaRoleEnum.enumValues)[number],
    fileName: string
  ) {
    if (!uploaded) return null;
    const [m] = await db
      .insert(schema.media)
      .values({
        ownerType: "artist",
        ownerId: artistId,
        role,
        blobUrl: uploaded.url,
        blobPathname: new URL(uploaded.url).pathname.replace(/^\//, ""),
        fileName,
        mimeType: mimeTypeFor(fileName),
        sizeBytes: uploaded.sizeBytes,
      })
      .returning({ id: schema.media.id });
    return m.id;
  }

  const profileMediaId = await insertMediaFor(
    await uploadLocalImage(artist.profileImage, artistId, "profile_photo"),
    "profile_photo",
    path.basename(artist.profileImage)
  );
  const heroMediaId = await insertMediaFor(
    await uploadLocalImage(artist.heroImage, artistId, "hero_photo"),
    "hero_photo",
    path.basename(artist.heroImage)
  );
  const aboutMediaId = await insertMediaFor(
    await uploadLocalImage(artist.aboutImage, artistId, "about_photo"),
    "about_photo",
    path.basename(artist.aboutImage)
  );
  const ogMediaId = await insertMediaFor(
    await uploadLocalImage(artist.ogImage, artistId, "og_image"),
    "og_image",
    path.basename(artist.ogImage)
  );

  const { eq } = await import("drizzle-orm");
  await db
    .update(schema.artists)
    .set({
      profileImageMediaId: profileMediaId,
      heroImageMediaId: heroMediaId,
      aboutImageMediaId: aboutMediaId,
      ogImageMediaId: ogMediaId,
    })
    .where(eq(schema.artists.id, artistId));

  const releases = [...artist.albums, ...artist.eps, ...artist.singles];
  for (const [i, release] of releases.entries()) {
    const coverMediaId = await insertMediaFor(
      await uploadLocalImage(release.coverImage, artistId, "release_artwork"),
      "release_artwork",
      path.basename(release.coverImage)
    );
    await db.insert(schema.releases).values({
      artistId,
      type: release.type,
      title: release.title,
      releaseDate: release.releaseDate,
      coverImageMediaId: coverMediaId,
      description: release.description,
      trackCount: release.trackCount,
      streamingLinks: release.streamingLinks,
      sortOrder: i,
    });
  }

  for (const [i, video] of artist.videos.entries()) {
    const posterMediaId = await insertMediaFor(
      await uploadLocalImage(video.posterImage, artistId, "gallery_photo"),
      "gallery_photo",
      path.basename(video.posterImage)
    );
    await db.insert(schema.artistVideos).values({
      artistId,
      title: video.title,
      description: video.description,
      platform: video.platform,
      videoId: video.videoId,
      posterImageMediaId: posterMediaId,
      featured: video.featured ?? false,
      sortOrder: i,
    });
  }

  for (const [i, img] of artist.gallery.entries()) {
    const mediaId = await insertMediaFor(await uploadLocalImage(img.src, artistId, "gallery_photo"), "gallery_photo", path.basename(img.src));
    if (!mediaId) continue;
    await db.insert(schema.galleryImages).values({
      artistId,
      mediaId,
      alt: img.alt,
      category: img.category,
      sortOrder: i,
    });
  }

  for (const [i, show] of artist.shows.entries()) {
    await db.insert(schema.shows).values({
      artistId,
      date: show.date,
      city: show.city,
      venue: show.venue,
      country: show.country ?? "",
      eventType: show.eventType,
      status: show.status,
      ticketUrl: show.ticketUrl ?? null,
      detailsUrl: show.detailsUrl ?? null,
      isPast: show.isPast ?? false,
      sortOrder: i,
    });
  }

  for (const [i, member] of artist.bandMembers.entries()) {
    const photoMediaId = await insertMediaFor(
      await uploadLocalImage(member.photo, artistId, "band_member_photo"),
      "band_member_photo",
      path.basename(member.photo)
    );
    await db.insert(schema.bandMembers).values({
      artistId,
      name: member.name,
      role: member.role,
      photoMediaId,
      bio: member.bio,
      instagram: member.instagram ?? null,
      sortOrder: i,
    });
  }

  for (const [i, format] of artist.performanceFormats.entries()) {
    await db.insert(schema.performanceFormats).values({
      artistId,
      formatId: format.id,
      name: format.name,
      lineup: format.lineup,
      style: format.style,
      suitableFor: format.suitableFor,
      sortOrder: i,
    });
  }

  for (const [i, collab] of artist.collaborations.entries()) {
    const logoMediaId = collab.logo
      ? await insertMediaFor(await uploadLocalImage(collab.logo, artistId, "gallery_photo"), "gallery_photo", path.basename(collab.logo))
      : null;
    await db.insert(schema.collaborations).values({
      artistId,
      name: collab.name,
      type: collab.type,
      logoMediaId,
      description: collab.description ?? null,
      sortOrder: i,
    });
  }

  for (const [i, testimonial] of artist.testimonials.entries()) {
    await db.insert(schema.testimonials).values({
      artistId,
      quote: testimonial.quote,
      clientName: testimonial.clientName,
      eventType: testimonial.eventType,
      sortOrder: i,
    });
  }

  console.log(`  done — artist id ${artistId}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  for (const artist of staticArtists) {
    await seedArtist(db, artist);
  }

  await pool.end();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
