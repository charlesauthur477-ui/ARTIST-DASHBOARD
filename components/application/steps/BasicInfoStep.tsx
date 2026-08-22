import type { ArtistApplication } from "@/types/application";
import { ARTIST_TYPES, PRIMARY_ROLES } from "@/types/application";
import { StepShell, StepSubsection } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import { TextAreaField } from "@/components/application/fields/TextAreaField";
import { SelectField } from "@/components/application/fields/SelectField";
import type { StepComponentProps } from "./types";

const ARTIST_TYPE_LABELS: Record<(typeof ARTIST_TYPES)[number], string> = {
  solo: "Solo Artist",
  band: "Band",
  duo: "Duo",
  dj: "DJ",
  singer: "Singer",
  instrumentalist: "Instrumentalist",
  other: "Other",
};

const PRIMARY_ROLE_LABELS: Record<(typeof PRIMARY_ROLES)[number], string> = {
  vocalist: "Vocalist",
  singer: "Singer",
  songwriter: "Songwriter",
  musician: "Musician",
  producer: "Producer",
  dj: "DJ",
  band: "Band",
  other: "Other",
};

export function BasicInfoStep({ data, update, errors }: StepComponentProps) {
  return (
    <StepShell
      title="Basic Information"
      description="Let's start with who you are. This forms the foundation of your public artist profile."
    >
      <StepSubsection title="About You">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Artist / Stage Name"
            required
            value={data.stageName}
            onChange={(v) => update("stageName", v)}
            error={errors.stageName}
            placeholder="e.g. Aurora Noir"
          />
          <TextInput
            label="Real Name"
            value={data.realName}
            onChange={(v) => update("realName", v)}
            placeholder="Optional, for our records"
          />
          <TextInput
            label="Pronunciation"
            value={data.pronunciation}
            onChange={(v) => update("pronunciation", v)}
            placeholder={'e.g. "oh-ROAR-ah nwahr"'}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="City" value={data.city} onChange={(v) => update("city", v)} />
            <TextInput label="Country" value={data.country} onChange={(v) => update("country", v)} />
          </div>
          <TextInput
            label="Primary Genre"
            value={data.primaryGenre}
            onChange={(v) => update("primaryGenre", v)}
            placeholder="e.g. Alternative Pop"
          />
          <TextInput
            label="Secondary Genres"
            value={data.secondaryGenres}
            onChange={(v) => update("secondaryGenres", v)}
            placeholder="e.g. Electronic, Cinematic"
          />
        </div>
        <TextInput
          label="Artist Tagline"
          value={data.tagline}
          onChange={(v) => update("tagline", v)}
          placeholder="e.g. Singer • Songwriter • Live Performer"
          maxLength={80}
        />
        <TextAreaField
          label="Short Bio"
          value={data.shortBio}
          onChange={(v) => update("shortBio", v)}
          rows={3}
          maxLength={280}
          helpText="A one or two sentence summary used on your homepage."
        />
        <TextAreaField
          label="Full Biography"
          value={data.fullBio}
          onChange={(v) => update("fullBio", v)}
          rows={8}
          helpText="Tell your full story — this will appear on your About and Press pages."
        />
      </StepSubsection>

      <StepSubsection title="Artist Profile">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Artist Type"
            value={data.artistType}
            onChange={(v) => update("artistType", v as ArtistApplication["artistType"])}
            placeholder="Select one"
            options={ARTIST_TYPES.map((t) => ({ value: t, label: ARTIST_TYPE_LABELS[t] }))}
          />
          <SelectField
            label="Primary Role"
            value={data.primaryRole}
            onChange={(v) => update("primaryRole", v as ArtistApplication["primaryRole"])}
            placeholder="Select one"
            options={PRIMARY_ROLES.map((r) => ({ value: r, label: PRIMARY_ROLE_LABELS[r] }))}
          />
          <TextInput label="Years Active" value={data.yearsActive} onChange={(v) => update("yearsActive", v)} placeholder="e.g. 2019 – present" />
          <TextInput
            label="Languages Performed"
            value={data.languagesPerformed}
            onChange={(v) => update("languagesPerformed", v)}
            placeholder="e.g. English, Spanish"
          />
        </div>
        <TextAreaField
          label="Music Style / Description"
          value={data.styleDescription}
          onChange={(v) => update("styleDescription", v)}
          rows={3}
        />
        <TextAreaField label="Career Highlights" value={data.careerHighlights} onChange={(v) => update("careerHighlights", v)} rows={3} helpText="One per line works well." />
        <TextAreaField label="Awards / Achievements" value={data.awards} onChange={(v) => update("awards", v)} rows={3} />
        <TextAreaField label="Notable Performances" value={data.notablePerformances} onChange={(v) => update("notablePerformances", v)} rows={3} />
        <TextAreaField label="Festivals Played" value={data.festivalsPlayed} onChange={(v) => update("festivalsPlayed", v)} rows={2} />
        <TextAreaField label="Media Features" value={data.mediaFeatures} onChange={(v) => update("mediaFeatures", v)} rows={2} helpText="Any press, radio, or media coverage." />
      </StepSubsection>
    </StepShell>
  );
}
