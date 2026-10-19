// ---------------------------------------------------------------------------
// Safe JSON-LD serialization for <script type="application/ld+json">
// dangerouslySetInnerHTML blocks (app/page.tsx, app/artists/[slug]/page.tsx,
// app/artists/[slug]/shows/page.tsx). Production-readiness audit finding,
// 3-day sprint item 5: JSON.stringify() does NOT escape "<", so a "</" inside
// artist-controlled data (profile bio, show title, etc. — all free-text
// fields with no server-side HTML sanitization) can close the surrounding
// <script> tag early and inject arbitrary markup/script into the page for
// every visitor. Escaping "<" as a unicode escape neutralizes that while
// staying valid, semantically-identical JSON (JSON strings may contain
// literal "<" or the < escape interchangeably — both parse to the same
// value), so this changes nothing about the structured data itself.
// ---------------------------------------------------------------------------
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
