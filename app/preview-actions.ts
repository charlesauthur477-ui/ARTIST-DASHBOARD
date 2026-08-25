"use server";

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function exitPreviewAction() {
  const draft = await draftMode();
  draft.disable();
  redirect("/admin/artists");
}
