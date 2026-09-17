"use client";

import dynamic from "next/dynamic";

export const LogConsole = dynamic(
  () => import("./logs").then((mod) => mod.LogConsole),
  { ssr: false }
);

export default LogConsole;
