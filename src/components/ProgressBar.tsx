"use client";

import dynamic from "next/dynamic";

export const ProgressBar = dynamic(
  () => import("./progress").then((mod) => mod.ProgressBar),
  { ssr: false }
);

export default ProgressBar;
