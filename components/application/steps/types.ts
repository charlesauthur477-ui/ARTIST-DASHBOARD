import type { ApplicationFieldErrors, ArtistApplication } from "@/types/application";

export interface StepComponentProps {
  data: ArtistApplication;
  update: <K extends keyof ArtistApplication>(key: K, value: ArtistApplication[K]) => void;
  errors: ApplicationFieldErrors;
  /**
   * The draft application's database id (Phase 3) — created once when the
   * wizard mounts (see ApplicationWizard.tsx), before any file can be
   * uploaded. Steps with a FileInput/MultiFileInput pass this straight
   * through so uploads can be attributed to the right application. Null
   * only for the brief moment before that draft row has been created.
   */
  applicationId: string | null;
}
