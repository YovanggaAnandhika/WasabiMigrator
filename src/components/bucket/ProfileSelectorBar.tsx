"use client";

import React from "react";
import { Bookmark, Plus } from "lucide-react";
import { BucketConfig, ProfileRecord } from "@/lib/types";

interface ProfileSelectorBarProps {
  profiles: ProfileRecord[];
  disabled: boolean;
  onSelectProfile: (config: BucketConfig) => void;
  onOpenProfileManager?: () => void;
}

export const ProfileSelectorBar: React.FC<ProfileSelectorBarProps> = ({
  profiles,
  disabled,
  onSelectProfile,
  onOpenProfileManager,
}) => {
  return (
    <div className="mt-3 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Bookmark className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 shrink-0">
          Profil Tersimpan:
        </span>
        <select
          disabled={disabled}
          value=""
          onChange={(e) => {
            const selected = profiles.find((p) => p.id === e.target.value);
            if (selected) {
              onSelectProfile({
                endpoint_url: selected.endpoint_url,
                region: selected.region,
                access_key_id: selected.access_key_id,
                secret_access_key: selected.secret_access_key,
                bucket_name: selected.bucket_name,
                prefix: selected.prefix,
                use_path_style: selected.use_path_style,
              });
            }
          }}
          className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="" disabled>
            {profiles.length > 0 ? "-- Pilih Profil Kredensial --" : "(Belum ada profil tersimpan)"}
          </option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.bucket_name ? `(${p.bucket_name})` : ""}
            </option>
          ))}
        </select>
      </div>

      {onOpenProfileManager && (
        <button
          type="button"
          disabled={disabled}
          onClick={onOpenProfileManager}
          className="flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition shrink-0"
        >
          <Plus className="h-3 w-3" />
          <span>Kelola Profil</span>
        </button>
      )}
    </div>
  );
};
