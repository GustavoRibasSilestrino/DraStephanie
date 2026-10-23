"use client";

import { MotionConfig } from "motion/react";

/** Respeita "reduzir movimento" do sistema: as transformações são desativadas. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
