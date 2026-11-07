"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { clearAdminSession } from "@/lib/admin/session";

export async function logoutAction() {
  await clearAdminSession();
  try {
    await signOut({ redirect: false });
  } catch {
    // Ignore
  }
  redirect("/admin/login");
}

