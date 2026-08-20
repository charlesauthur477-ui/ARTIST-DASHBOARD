import Image from "next/image";
import type { InstagramPost } from "@/types/artist";
import { Button } from "@/components/ui/Button";
import { InstagramIcon } from "@/components/ui/BrandIcons";

/**
 * V1 static Instagram feed — see README "Instagram — future architecture"
 * for the planned official Meta/Instagram OAuth integration. This component
 * only ever renders data passed to it; it never talks to Instagram itself.
 */
export function InstagramFeed({
  posts,
  handle,
}: {
  posts: InstagramPost[];
  handle?: string;
}) {
  if (posts.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-square overflow-hidden rounded-md bg-surface"
          >
            <Image
              src={post.image}
              alt={post.captionPreview}
              fill
              sizes="(min-width: 640px) 25vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/0 to-transparent p-3 opacity-0 transition group-hover:opacity-100"
            >
              <span className="line-clamp-2 text-xs text-white">{post.captionPreview}</span>
            </span>
          </a>
        ))}
      </div>
      {handle ? (
        <div className="mt-8 text-center">
          <Button
            href={`https://instagram.com/${handle.replace("@", "")}`}
            external
            variant="secondary"
            icon={<InstagramIcon className="h-4 w-4" />}
          >
            Follow {handle}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
