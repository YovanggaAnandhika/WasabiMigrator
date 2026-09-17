"use client";

import dynamic from "next/dynamic";

export const BucketCard = dynamic(
  () => import("./bucket").then((mod) => mod.BucketCard),
  { ssr: false }
);

export default BucketCard;
