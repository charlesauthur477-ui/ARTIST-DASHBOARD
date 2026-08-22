"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/**
 * Makes every Framer Motion animation in the app respect the OS-level
 * "reduce motion" accessibility setting. Framer Motion animates outside the
 * normal CSS transition/animation pipeline, so the `prefers-reduced-motion`
 * media query in globals.css (which only catches plain CSS transitions)
 * cannot reach it on its own — `reducedMotion="user"` is the actual switch.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
