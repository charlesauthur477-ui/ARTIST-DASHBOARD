import { StepShell } from "@/components/application/StepShell";
import { FileInput } from "@/components/application/fields/FileInput";
import { MultiFileInput } from "@/components/application/fields/MultiFileInput";
import type { StepComponentProps } from "./types";

export function PhotosStep({ data, update, errors }: StepComponentProps) {
  return (
    <StepShell
      title="Photos"
      description="Upload high-resolution professional photos whenever possible — these will be the visual foundation of your website. Photos you select here stay in your browser for this session and are not yet uploaded to permanent storage (our media upload system is still being connected). We'll follow up separately to collect final files."
    >
      <FileInput
        label="Profile Photo"
        required
        asset={data.profilePhoto}
        onChange={(a) => update("profilePhoto", a)}
        error={errors.profilePhoto}
        helpText="A clear, high-quality headshot or portrait. Used across your site and press kit."
      />
      <FileInput
        label="Hero / Cover Photo"
        required
        asset={data.heroPhoto}
        onChange={(a) => update("heroPhoto", a)}
        error={errors.heroPhoto}
        helpText="A wide, cinematic image for your homepage banner. Landscape orientation works best."
      />
      <MultiFileInput
        label="Additional Photos"
        assets={data.additionalPhotos}
        onChange={(a) => update("additionalPhotos", a)}
        helpText="Live, editorial, studio, backstage — add as many as you'd like for your gallery."
        max={20}
      />
    </StepShell>
  );
}
