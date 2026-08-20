import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="text-xs font-medium tracking-[0.3em] text-bronze-300 uppercase">404</p>
      <h1 className="font-display mt-4 text-4xl sm:text-5xl">Page Not Found</h1>
      <p className="mt-4 max-w-md text-sm text-muted sm:text-base">
        The page you&rsquo;re looking for doesn&rsquo;t exist, or the artist you&rsquo;re looking for hasn&rsquo;t been added yet.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-bronze-400 px-8 text-sm font-semibold tracking-wide text-[#0b0a09]"
      >
        Back to Homepage
      </Link>
    </div>
  );
}
