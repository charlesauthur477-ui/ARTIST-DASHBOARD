import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArtistSlugs, getArtistBySlug, getArtistGallery } from "@/lib/artists";
import { PageHero } from "@/components/ui/PageHero";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

export async function generateStaticParams() {
  return (await getAllArtistSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]/gallery">): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `Gallery | ${artist.name}`,
    description: `Live, editorial, and behind-the-scenes photography of ${artist.name}.`,
    alternates: { canonical: `/artists/${artist.slug}/gallery` },
  };
}

export default async function GalleryPage({ params }: PageProps<"/artists/[slug]/gallery">) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const gallery = await getArtistGallery(slug);

  return (
    <>
      <PageHero eyebrow="Photography" title="Gallery" description={`Live, editorial, and behind-the-scenes photography of ${artist.name}.`} />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <GalleryGrid images={gallery} />
      </section>
    </>
  );
}
