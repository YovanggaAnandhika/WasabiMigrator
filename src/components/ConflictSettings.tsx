"use client";

import dynamic from "next/dynamic";

export const ConflictSettings = dynamic(
  () => import("./conflict").then((mod) => mod.ConflictSettings),
  { ssr: false }
);

export default ConflictSettings;
