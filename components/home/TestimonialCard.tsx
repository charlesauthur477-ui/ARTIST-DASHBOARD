import { Quote } from "lucide-react";
import type { Testimonial } from "@/types/artist";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-lg border border-border-subtle p-6 sm:p-7">
      <Quote className="h-6 w-6 text-bronze-400" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground/90">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-5 text-sm">
        <span className="font-medium text-foreground">{testimonial.clientName}</span>
        <span className="text-muted"> · {testimonial.eventType}</span>
      </figcaption>
    </figure>
  );
}
