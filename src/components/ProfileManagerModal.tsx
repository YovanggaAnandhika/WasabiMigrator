"use client";

import dynamic from "next/dynamic";

export const ProfileManagerModal = dynamic(
  () => import("./profiles").then((mod) => mod.ProfileManagerModal),
  { ssr: false }
);

export default ProfileManagerModal;
