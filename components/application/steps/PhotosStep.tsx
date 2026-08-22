import { StepShell } from "@/components/application/StepShell";
import { FileInput } from "@/components/application/fields/FileInput";
import { MultiFileInput } from "@/components/application/fields/MultiFileInput";
import type { StepComponentProps } from "./types";

export function PhotosStep({ data, update, errors, applicationId }: StepComponentProps) {
  return (
    <StepShell
      title="Photos"
      description="Upload high-resolution professional photos whenever possible — these will be the visual foundation of your website. Photos are uploaded to permanent storage as soon as you select them."
    >
      <FileInput
        label="Profile Photo"
        required
        asset={data.profilePhoto}
        onChange={(a) => update("profilePhoto", a)}
        applicationId={applicationId}
        role="profile_photo"
        error={errors.profilePhoto}
        helpText="A clear, high-quality headshot or portrait. Used across your site and press kit."
      />
      <FileInput
        label="Hero / Cover Photo"
        required
        asset={data.heroPhoto}
        onChange={(a) => update("heroPhoto", a)}
        applicationId={applicationId}
        role="hero_photo"
        error={errors.heroPhoto}
        helpText="A wide, cinematic image for your homepage banner. Landscape orientation works best."
      />
      <MultiFileInput
        label="Additional Photos"
        assets={data.additionalPhotos}
        onChange={(a) => update("additionalPhotos", a)}
        applicationId={applicationId}
        role="gallery_photo"
        helpText="Live, editorial, studio, backstage — add as many as you'd like for your gallery."
        max={20}
      />
    </StepShell>
  );
}
