import type { Artist } from "@/types/artist";

// ---------------------------------------------------------------------------
// DEMO ARTIST — NOVA VALE
// A second, fictional artist record. Its purpose is to prove the platform is
// genuinely multi-artist: /artists/nova-vale renders through the exact same
// components as /artists/aurora-noir, with entirely different data.
// Populated more lightly than Aurora Noir on purpose — still enough to
// exercise every page and component.
// ---------------------------------------------------------------------------

const base = "/artists/nova-vale";

export const novaVale: Artist = {
  id: "nova-vale",
  slug: "nova-vale",
  name: "Nova Vale",
  stageName: "Nova Vale",
  tagline: "Vocalist • Multi-Instrumentalist",
  genre: "Indie Soul / Neo-Folk",
  location: "Based in Lisbon, touring across Europe",
  profileImage: `${base}/profile.jpg`,
  heroImage: `${base}/hero.jpg`,
  aboutImage: `${base}/about.jpg`,
  bio: `Nova Vale blends indie soul with neo-folk instrumentation — warm vocals, acoustic guitar, and understated electronic production. Since emerging in 2023, Nova has built an audience through intimate listening-room shows and a string of independently released singles.

Known for a calm, magnetic stage presence, Nova Vale performs everything from stripped-back solo sets to full-band arrangements, and is available for weddings, private events, and boutique festival bookings across Europe.`,
  shortBio:
    "Nova Vale is an indie soul and neo-folk artist known for warm, intimate vocals and a live show built around acoustic textures.",
  careerHighlights: [
    { id: "h1", label: "1 EP and 4 singles released independently" },
    { id: "h2", label: "40+ live performances across 6 countries" },
    { id: "h3", label: "Featured on two boutique European festival line-ups" },
  ],
  socialLinks: {
    instagram: "https://instagram.com/novavale.music",
    spotify: "https://open.spotify.com/artist/demo-nova-vale",
    youtube: "https://youtube.com/@novavalemusic",
  },
  streamingLinks: {
    spotify: "https://open.spotify.com/artist/demo-nova-vale",
    youtube: "https://youtube.com/@novavalemusic",
  },
  albums: [],
  eps: [
    {
      id: "sea-glass",
      type: "ep",
      title: "Sea Glass",
      releaseDate: "2024-06-10",
      coverImage: `${base}/music/sea-glass.jpg`,
      description: "Nova Vale's debut EP — five songs written between Lisbon and the coast.",
      trackCount: 5,
      streamingLinks: {
        spotify: "https://open.spotify.com/album/demo-sea-glass",
        youtube: "https://youtube.com/playlist?list=demo-sea-glass",
      },
    },
  ],
  singles: [
    {
      id: "halflight",
      type: "single",
      title: "Halflight",
      releaseDate: "2026-04-02",
      coverImage: `${base}/music/halflight.jpg`,
      description: "Nova Vale's latest single, a slow-building acoustic-soul track.",
      streamingLinks: {
        spotify: "https://open.spotify.com/track/demo-halflight",
      },
    },
  ],
  videos: [
    {
      id: "sea-glass-live",
      title: "Sea Glass — Live Session",
      description: "A live session recorded for the Sea Glass EP release.",
      platform: "youtube",
      videoId: "dQw4w9WgXcQ",
      posterImage: `${base}/video-featured.jpg`,
      featured: true,
    },
  ],
  gallery: [
    { id: "g1", src: `${base}/gallery/gallery-01.jpg`, alt: "Nova Vale performing live", category: "live", width: 1400, height: 1750 },
    { id: "g2", src: `${base}/gallery/gallery-02.jpg`, alt: "Nova Vale editorial portrait", category: "editorial", width: 1400, height: 1050 },
    { id: "g3", src: `${base}/gallery/gallery-03.jpg`, alt: "Nova Vale in the studio", category: "studio", width: 1400, height: 1750 },
    { id: "g4", src: `${base}/gallery/gallery-04.jpg`, alt: "Nova Vale backstage", category: "backstage", width: 1400, height: 1050 },
    { id: "g5", src: `${base}/gallery/gallery-05.jpg`, alt: "Nova Vale performing at a private event", category: "events", width: 1400, height: 1750 },
    { id: "g6", src: `${base}/gallery/gallery-06.jpg`, alt: "Nova Vale live at a festival", category: "live", width: 1400, height: 1050 },
  ],
  shows: [
    { id: "s1", date: "2026-09-20", city: "Lisbon", venue: "Casa Acústica", eventType: "Live Concert", status: "tickets", ticketUrl: "https://tickets.example.com/demo-lisbon" },
    { id: "s2", date: "2026-10-11", city: "Porto", venue: "Riverside Sessions", eventType: "Private Event", status: "private-event" },
    { id: "p1", date: "2026-02-14", city: "Madrid", venue: "Sala Íntima", eventType: "Concert", status: "booked", isPast: true },
  ],
  bandMembers: [
    { id: "b0", name: "Nova Vale", role: "Vocals, Guitar", photo: `${base}/profile.jpg`, bio: "Songwriter and vocalist behind Nova Vale.", instagram: "https://instagram.com/novavale.music" },
  ],
  performanceFormats: [
    { id: "solo", name: "Solo", lineup: "Nova Vale, voice and guitar", style: "Warm, intimate acoustic set", suitableFor: ["Small private events", "Listening rooms"] },
    { id: "duo", name: "Duo", lineup: "Nova Vale + cello or keys", style: "Layered acoustic arrangements", suitableFor: ["Weddings", "Boutique events"] },
    { id: "full-band", name: "Full Band", lineup: "4-piece band", style: "Full arrangements of the recorded catalogue", suitableFor: ["Festivals", "Concerts"] },
  ],
  collaborations: [
    { id: "c1", name: "Riverside Sessions (demo)", type: "Live Series Partner", description: "Recurring resident artist for an intimate live series." },
  ],
  testimonials: [
    { id: "t1", quote: "Nova's set was the most talked-about part of our evening — understated and completely captivating.", clientName: "M. Silva (demo)", eventType: "Private Event" },
  ],
  pressKit: {
    heroImage: `${base}/about.jpg`,
    bio: `Nova Vale blends indie soul with neo-folk instrumentation — warm vocals, acoustic guitar, and understated electronic production.`,
    shortBio: "Nova Vale is an indie soul and neo-folk artist known for warm, intimate vocals.",
    pressPhotos: [`${base}/gallery/gallery-02.jpg`, `${base}/gallery/gallery-03.jpg`],
    downloadUrl: `${base}/press-kit-placeholder.pdf`,
  },
  bookingSettings: {
    eventTypes: ["Wedding", "Corporate", "Festival", "Club", "Concert", "Private Event", "Other"],
    performanceFormats: ["solo", "duo", "full-band"],
    budgetRanges: ["Under $2,000", "$2,000 – $5,000", "$5,000 – $10,000", "Prefer to discuss"],
    enquiryNote: "Enquire for availability & pricing",
  },
  contactInformation: {
    bookings: { label: "Bookings", email: "bookings@novavale-demo.com" },
    management: { label: "Management", email: "management@novavale-demo.com" },
    press: { label: "Press", email: "press@novavale-demo.com" },
    general: { label: "General Enquiries", email: "hello@novavale-demo.com" },
  },
  instagramHandle: "@novavale.music",
  instagramFeed: [
    { id: "ig1", image: `${base}/gallery/gallery-01.jpg`, captionPreview: "Lisbon, thank you for last night", date: "2026-08-10", permalink: "https://instagram.com/novavale.music" },
  ],
  ogImage: `${base}/og.jpg`,
  isDemo: true,
};
