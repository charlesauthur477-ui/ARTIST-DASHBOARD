import type { Artist } from "@/types/artist";

// ---------------------------------------------------------------------------
// DEMO ARTIST — AURORA NOIR
// Fictional artist created for development/demo purposes only.
// All names, quotes, brands, and biographical details below are invented.
// Replace every field with real artist data when onboarding a real client —
// see README.md → "Adding a new artist".
// ---------------------------------------------------------------------------

const base = "/artists/aurora-noir";

export const auroraNoir: Artist = {
  id: "aurora-noir",
  slug: "aurora-noir",
  name: "Aurora Noir",
  stageName: "Aurora Noir",
  tagline: "Singer • Songwriter • Live Performer",
  genre: "Alternative Pop / Electronic / Cinematic",
  location: "Based in Mumbai, touring worldwide",
  profileImage: `${base}/profile.jpg`,
  heroImage: `${base}/hero.jpg`,
  aboutImage: `${base}/about.jpg`,
  bio: `Aurora Noir makes music for the hour between midnight and morning — alternative pop built on cinematic synths, live strings, and a voice that has been described as "velvet over static." Since her debut EP in 2021, she has built a devoted audience across festivals, private events, and late-night listening rooms, known equally for the atmosphere of her studio releases and the intensity of her live shows.

Her sound draws from trip-hop, art pop, and film scoring in equal measure, and her live performances range from a single voice and piano to a full five-piece band with strings and cinematic lighting design. Whether she's opening a festival main stage or performing an intimate acoustic set for two hundred guests, Aurora Noir is known for delivering a complete, considered experience — never a generic cover-band set.

Aurora Noir is represented for concerts, weddings, corporate events, festivals, clubs, colleges, private events, and brand activations worldwide.`,
  shortBio:
    "Aurora Noir is an alternative pop and electronic artist known for cinematic soundscapes, a distinctive vocal tone, and a live show that scales from a solo piano set to a full five-piece band.",
  careerHighlights: [
    { id: "h1", label: "2 studio albums, 1 EP, and 8 singles released independently" },
    { id: "h2", label: "150+ live performances across 12 countries" },
    { id: "h3", label: "Featured performer at Neon Horizon Festival (2024, 2025)" },
    { id: "h4", label: "Music supervised for two independent feature films" },
    { id: "h5", label: "180K+ combined streaming and social audience" },
  ],
  socialLinks: {
    instagram: "https://instagram.com/auroranoir.music",
    youtube: "https://youtube.com/@auroranoirmusic",
    spotify: "https://open.spotify.com/artist/demo-aurora-noir",
    appleMusic: "https://music.apple.com/artist/demo-aurora-noir",
    tiktok: "https://tiktok.com/@auroranoir.music",
    facebook: "https://facebook.com/auroranoirmusic",
    x: "https://x.com/auroranoirmusic",
  },
  streamingLinks: {
    spotify: "https://open.spotify.com/artist/demo-aurora-noir",
    appleMusic: "https://music.apple.com/artist/demo-aurora-noir",
    youtube: "https://youtube.com/@auroranoirmusic",
  },
  albums: [
    {
      id: "midnight-static",
      type: "album",
      title: "Midnight Static",
      releaseDate: "2023-09-15",
      coverImage: `${base}/music/midnight-static.jpg`,
      description:
        "Aurora Noir's debut full-length album — twelve tracks exploring insomnia, city lights, and the space between analog and digital sound.",
      trackCount: 12,
      streamingLinks: {
        spotify: "https://open.spotify.com/album/demo-midnight-static",
        appleMusic: "https://music.apple.com/album/demo-midnight-static",
        youtube: "https://youtube.com/playlist?list=demo-midnight-static",
      },
    },
    {
      id: "glass-season",
      type: "album",
      title: "Glass Season",
      releaseDate: "2025-03-21",
      coverImage: `${base}/music/glass-season.jpg`,
      description:
        "A more expansive, string-laden follow-up recorded with a live ensemble — Aurora Noir's most cinematic record to date.",
      trackCount: 10,
      streamingLinks: {
        spotify: "https://open.spotify.com/album/demo-glass-season",
        appleMusic: "https://music.apple.com/album/demo-glass-season",
        youtube: "https://youtube.com/playlist?list=demo-glass-season",
      },
    },
  ],
  eps: [
    {
      id: "afterglow-ep",
      type: "ep",
      title: "Afterglow",
      releaseDate: "2021-11-05",
      coverImage: `${base}/music/afterglow-ep.jpg`,
      description:
        "The debut EP that introduced Aurora Noir's signature blend of intimate songwriting and electronic texture.",
      trackCount: 5,
      streamingLinks: {
        spotify: "https://open.spotify.com/album/demo-afterglow",
        appleMusic: "https://music.apple.com/album/demo-afterglow",
      },
    },
  ],
  singles: [
    {
      id: "paper-moons",
      type: "single",
      title: "Paper Moons",
      releaseDate: "2026-06-12",
      coverImage: `${base}/music/paper-moons.jpg`,
      description: "The latest single — a stripped-back piano ballad about long-distance love.",
      streamingLinks: {
        spotify: "https://open.spotify.com/track/demo-paper-moons",
        appleMusic: "https://music.apple.com/song/demo-paper-moons",
        youtube: "https://youtube.com/watch?v=demo-paper-moons",
      },
    },
    {
      id: "static-and-silk",
      type: "single",
      title: "Static & Silk",
      releaseDate: "2025-08-01",
      coverImage: `${base}/music/static-and-silk.jpg`,
      description: "An up-tempo electronic-pop single, and a fan-favourite closer in Aurora's live sets.",
      streamingLinks: {
        spotify: "https://open.spotify.com/track/demo-static-and-silk",
        appleMusic: "https://music.apple.com/song/demo-static-and-silk",
      },
    },
    {
      id: "low-light",
      type: "single",
      title: "Low Light",
      releaseDate: "2024-11-20",
      coverImage: `${base}/music/low-light.jpg`,
      description: "A moody mid-tempo track written for a late-night drive.",
      streamingLinks: {
        spotify: "https://open.spotify.com/track/demo-low-light",
        youtube: "https://youtube.com/watch?v=demo-low-light",
      },
    },
  ],
  videos: [
    {
      id: "glass-season-live",
      title: "Glass Season — Live Session",
      description: "Full band live session recorded for the Glass Season album release.",
      platform: "youtube",
      videoId: "dQw4w9WgXcQ",
      posterImage: `${base}/video-featured.jpg`,
      featured: true,
    },
    {
      id: "paper-moons-acoustic",
      title: "Paper Moons — Stripped",
      description: "An acoustic, one-take performance of Paper Moons.",
      platform: "youtube",
      videoId: "dQw4w9WgXcQ",
      posterImage: `${base}/video-acoustic.jpg`,
    },
    {
      id: "studio-bts",
      title: "Making Midnight Static",
      description: "Behind-the-scenes footage from the Midnight Static recording sessions.",
      platform: "youtube",
      videoId: "dQw4w9WgXcQ",
      posterImage: `${base}/video-studio.jpg`,
    },
  ],
  gallery: [
    { id: "g1", src: `${base}/gallery/gallery-01.jpg`, alt: "Aurora Noir performing live under stage lighting", category: "live", width: 1400, height: 1750 },
    { id: "g2", src: `${base}/gallery/gallery-02.jpg`, alt: "Aurora Noir on stage with full band", category: "live", width: 1400, height: 1050 },
    { id: "g3", src: `${base}/gallery/gallery-03.jpg`, alt: "Crowd view of an Aurora Noir festival set", category: "live", width: 1400, height: 1750 },
    { id: "g4", src: `${base}/gallery/gallery-04.jpg`, alt: "Editorial portrait of Aurora Noir", category: "editorial", width: 1400, height: 1050 },
    { id: "g5", src: `${base}/gallery/gallery-05.jpg`, alt: "Editorial portrait with cinematic lighting", category: "editorial", width: 1400, height: 1750 },
    { id: "g6", src: `${base}/gallery/gallery-06.jpg`, alt: "Close-up editorial portrait of Aurora Noir", category: "editorial", width: 1400, height: 1050 },
    { id: "g7", src: `${base}/gallery/gallery-07.jpg`, alt: "Aurora Noir recording vocals in studio", category: "studio", width: 1400, height: 1750 },
    { id: "g8", src: `${base}/gallery/gallery-08.jpg`, alt: "Studio session with the full band", category: "studio", width: 1400, height: 1050 },
    { id: "g9", src: `${base}/gallery/gallery-09.jpg`, alt: "Backstage moment before a show", category: "backstage", width: 1400, height: 1750 },
    { id: "g10", src: `${base}/gallery/gallery-10.jpg`, alt: "Band warming up backstage", category: "backstage", width: 1400, height: 1050 },
    { id: "g11", src: `${base}/gallery/gallery-11.jpg`, alt: "Aurora Noir at a private corporate event", category: "events", width: 1400, height: 1750 },
    { id: "g12", src: `${base}/gallery/gallery-12.jpg`, alt: "Wedding performance by Aurora Noir", category: "events", width: 1400, height: 1050 },
  ],
  shows: [
    { id: "s1", date: "2026-09-12", city: "Mumbai", venue: "The Quorum House", eventType: "Private Event", status: "private-event" },
    { id: "s2", date: "2026-09-28", city: "Delhi", venue: "Capital Live Arena", eventType: "Live Concert", status: "tickets", ticketUrl: "https://tickets.example.com/demo-delhi" },
    { id: "s3", date: "2026-10-14", city: "Dubai", venue: "Marina Sound Festival", eventType: "Festival", status: "available", detailsUrl: "https://example.com/demo-dubai" },
    { id: "s4", date: "2026-11-02", city: "Bengaluru", venue: "Skyline Rooftop", eventType: "Club Show", status: "sold-out" },
    { id: "s5", date: "2026-12-06", city: "Singapore", venue: "Harbour Nights Festival", eventType: "Festival", status: "available", detailsUrl: "https://example.com/demo-singapore" },
    { id: "p1", date: "2026-05-18", city: "Goa", venue: "Sunset Beach Club", eventType: "Club Show", status: "booked", isPast: true },
    { id: "p2", date: "2026-03-02", city: "Pune", venue: "Riverside Amphitheatre", eventType: "Concert", status: "booked", isPast: true },
    { id: "p3", date: "2025-12-19", city: "Jaipur", venue: "Heritage Wedding Venue", eventType: "Wedding", status: "booked", isPast: true },
    { id: "p4", date: "2025-10-30", city: "Mumbai", venue: "Neon Horizon Festival", eventType: "Festival", status: "booked", isPast: true },
    { id: "p5", date: "2025-08-14", city: "Hyderabad", venue: "Tech Summit Gala", eventType: "Corporate", status: "booked", isPast: true },
  ],
  bandMembers: [
    { id: "b0", name: "Aurora Noir", role: "Lead Vocals", photo: `${base}/band/aurora-noir.jpg`, bio: "Songwriter, vocalist, and creative director for every Aurora Noir performance.", instagram: "https://instagram.com/auroranoir.music" },
    { id: "b1", name: "Alex Morgan", role: "Guitar", photo: `${base}/band/alex-morgan.jpg`, bio: "Lead and atmospheric guitar, touring with Aurora Noir since 2022.", instagram: "https://instagram.com/demo.alexmorgan" },
    { id: "b2", name: "Jordan Blake", role: "Bass", photo: `${base}/band/jordan-blake.jpg`, bio: "Anchors the low end with a background in jazz and electronic production.", instagram: "https://instagram.com/demo.jordanblake" },
    { id: "b3", name: "Ethan Cole", role: "Drums", photo: `${base}/band/ethan-cole.jpg`, bio: "Session and touring drummer known for dynamic, cinematic percussion.", instagram: "https://instagram.com/demo.ethancole" },
    { id: "b4", name: "Maya Reed", role: "Keys", photo: `${base}/band/maya-reed.jpg`, bio: "Keyboardist and backing vocalist, responsible for the band's signature synth textures.", instagram: "https://instagram.com/demo.mayareed" },
  ],
  performanceFormats: [
    { id: "solo", name: "Solo", lineup: "Aurora Noir, voice and piano/synth", style: "Intimate, stripped-back arrangements", suitableFor: ["Cocktail hours", "Small private events", "Brand activations"] },
    { id: "duo", name: "Duo", lineup: "Aurora Noir + guitar or keys", style: "Warm, acoustic-leaning set with light electronic texture", suitableFor: ["Weddings", "Corporate dinners", "Boutique events"] },
    { id: "acoustic", name: "Acoustic", lineup: "Aurora Noir + 2 musicians", style: "Reimagined acoustic versions of the full catalogue", suitableFor: ["Weddings", "Listening rooms", "Private events"] },
    { id: "full-band", name: "Full Band", lineup: "5-piece band with full production", style: "The complete Aurora Noir live show, as heard on record", suitableFor: ["Concerts", "Festivals", "Large corporate events"] },
    { id: "full-concert", name: "Full Concert", lineup: "Full band plus strings and full lighting design", style: "A complete headline concert experience", suitableFor: ["Festivals", "Headline concerts", "Major brand events"] },
  ],
  collaborations: [
    { id: "c1", name: "Neon Horizon Festival", type: "Festival Partner", description: "Returning main-stage performer, 2024 & 2025." },
    { id: "c2", name: "Northlight Films (demo)", type: "Sync & Scoring", description: "Original music supervision for two independent features." },
    { id: "c3", name: "Studio Bloom Audio (demo)", type: "Recording Partner", description: "In-house studio partner for all Aurora Noir releases since 2023." },
    { id: "c4", name: "Verve Hotels Group (demo)", type: "Brand Activation", description: "Resident performance series across three flagship properties." },
    { id: "c5", name: "Cassette & Co. (demo)", type: "Merch Partner", description: "Limited-edition vinyl and merchandise collaboration." },
  ],
  testimonials: [
    { id: "t1", quote: "Aurora Noir turned our launch event into the best part of the night. Completely professional from first call to final encore.", clientName: "R. Kapoor (demo)", eventType: "Brand Event" },
    { id: "t2", quote: "Our guests are still talking about the acoustic set at our wedding. Exactly the atmosphere we wanted.", clientName: "S. & A. Mehta (demo)", eventType: "Wedding" },
    { id: "t3", quote: "One of the smoothest artist bookings we've ever handled — full production, on time, and an incredible performance.", clientName: "Neon Horizon Festival Team (demo)", eventType: "Festival" },
  ],
  pressKit: {
    heroImage: `${base}/press/press-hero.jpg`,
    bio: `Aurora Noir makes music for the hour between midnight and morning — alternative pop built on cinematic synths, live strings, and a voice that has been described as "velvet over static." Since her debut EP in 2021, she has built a devoted audience across festivals, private events, and late-night listening rooms.`,
    shortBio:
      "Aurora Noir is an alternative pop and electronic artist known for cinematic soundscapes and a live show that scales from solo piano to a full five-piece band.",
    pressPhotos: [
      `${base}/press/press-01.jpg`,
      `${base}/press/press-02.jpg`,
      `${base}/press/press-03.jpg`,
      `${base}/press/press-04.jpg`,
    ],
    downloadUrl: `${base}/press/aurora-noir-epk.pdf`,
  },
  bookingSettings: {
    eventTypes: ["Wedding", "Corporate", "Festival", "College", "Club", "Concert", "Private Event", "Brand Event", "Other"],
    performanceFormats: ["solo", "duo", "acoustic", "full-band", "full-concert"],
    budgetRanges: ["Under $2,000", "$2,000 – $5,000", "$5,000 – $10,000", "$10,000 – $25,000", "$25,000+", "Prefer to discuss"],
    enquiryNote: "Enquire for availability & pricing",
  },
  contactInformation: {
    bookings: { label: "Bookings", email: "bookings@auroranoir-demo.com", phone: "+1 (555) 010-2200" },
    management: { label: "Management", email: "management@auroranoir-demo.com", phone: "+1 (555) 010-2201" },
    press: { label: "Press", email: "press@auroranoir-demo.com" },
    general: { label: "General Enquiries", email: "hello@auroranoir-demo.com" },
  },
  instagramHandle: "@auroranoir.music",
  instagramFeed: [
    { id: "ig1", image: `${base}/gallery/gallery-01.jpg`, captionPreview: "Last night's set was one for the books ✨ thank you Mumbai", date: "2026-08-15", permalink: "https://instagram.com/auroranoir.music" },
    { id: "ig2", image: `${base}/gallery/gallery-05.jpg`, captionPreview: "New photos from the Glass Season shoot are up now", date: "2026-08-05", permalink: "https://instagram.com/auroranoir.music" },
    { id: "ig3", image: `${base}/gallery/gallery-09.jpg`, captionPreview: "Backstage before the Dubai show, see you all in October", date: "2026-07-28", permalink: "https://instagram.com/auroranoir.music" },
    { id: "ig4", image: `${base}/gallery/gallery-11.jpg`, captionPreview: "Private events are some of my favourite shows to play", date: "2026-07-19", permalink: "https://instagram.com/auroranoir.music" },
  ],
  ogImage: `${base}/og.jpg`,
  isDemo: true,
};
