import type { ApplicationFieldErrors, ArtistApplication } from "@/types/application";

export interface StepComponentProps {
  data: ArtistApplication;
  update: <K extends keyof ArtistApplication>(key: K, value: ArtistApplication[K]) => void;
  errors: ApplicationFieldErrors;
}
