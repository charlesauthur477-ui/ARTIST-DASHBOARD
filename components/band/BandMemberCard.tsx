import Image from "next/image";
import type { BandMember } from "@/types/artist";
import { InstagramIcon } from "@/components/ui/BrandIcons";

export function BandMemberCard({ member, priority = false }: { member: BandMember; priority?: boolean }) {
  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
        <Image
          src={member.photo}
          alt={`${member.name} — ${member.role}`}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 80vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          priority={priority}
        />
      </div>
      <div className="mt-4">
        <h3 className="font-display text-lg text-foreground">{member.name}</h3>
        <p className="text-xs font-medium tracking-[0.2em] text-bronze-300 uppercase">{member.role}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{member.bio}</p>
        {member.instagram ? (
          <a
            href={member.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} on Instagram`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70 hover:text-bronze-300"
          >
            <InstagramIcon className="h-3.5 w-3.5" />
            Instagram
          </a>
        ) : null}
      </div>
    </article>
  );
}
