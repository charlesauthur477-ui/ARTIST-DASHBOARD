import type { Artist } from "@/types/artist";
import { auroraNoir } from "./aurora-noir";
import { novaVale } from "./nova-vale";

/**
 * V1 static artist roster. To add a real artist, create a new file in this
 * folder following the same shape as aurora-noir.ts / nova-vale.ts, then
 * register it here. See README.md → "Adding a new artist" for the full
 * walkthrough. Nothing outside this folder needs to change.
 */
export const artists: Artist[] = [auroraNoir, novaVale];
