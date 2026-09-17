"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bookmark, ChevronDown, Check, FolderGit2 } from "lucide-react";
import { BucketConfig, ProfileRecord } from "@/lib/types";

interface ProfileSelectorBarProps {
  profiles: ProfileRecord[];
  currentConfig: BucketConfig;
  disabled: boolean;
  onSelectProfile: (config: BucketConfig) => void;
}

export const ProfileSelectorBar: React.FC<ProfileSelectorBarProps> = ({
  profiles,
  currentConfig,
  disabled,
  onSelectProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find matching profile ID based on endpoint_url, access_key_id and bucket_name
  const matchedProfile = profiles.find(
    (p) =>
      p.endpoint_url.trim().toLowerCase() === currentConfig.endpoint_url.trim().toLowerCase() &&
      p.access_key_id.trim() === currentConfig.access_key_id.trim() &&
      p.bucket_name.trim().toLowerCase() === (currentConfig.bucket_name || "").trim().toLowerCase()
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (p: ProfileRecord) => {
    onSelectProfile({
      endpoint_url: p.endpoint_url,
      region: p.region,
      access_key_id: p.access_key_id,
      secret_access_key: p.secret_access_key,
      bucket_name: p.bucket_name,
      prefix: p.prefix,
      use_path_style: p.use_path_style,
    });
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative mt-3 p-2 rounded-xl border transition-all ${
        matchedProfile
          ? "border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs"
          : "border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Bookmark
          className={`h-3.5 w-3.5 shrink-0 transition-colors ${
            matchedProfile ? "text-blue-500 fill-blue-500/20" : "text-slate-400 dark:text-zinc-500"
          }`}
        />
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 shrink-0">
          Profil:
        </span>

        {/* Custom Trigger Button */}
        <button
          type="button"
          disabled={disabled || profiles.length === 0}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex-1 flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded-lg border text-left transition ${
            matchedProfile
              ? "border-blue-500/50 bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-300 font-semibold shadow-xs"
              : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-medium hover:border-slate-400 dark:hover:border-zinc-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="truncate">
            {matchedProfile ? (
              <>
                <span>{matchedProfile.name}</span>
                {matchedProfile.bucket_name && (
                  <span className="text-slate-500 dark:text-zinc-400 font-normal font-mono ml-1.5">
                    ({matchedProfile.bucket_name})
                  </span>
                )}
              </>
            ) : profiles.length > 0 ? (
              <span className="text-slate-400 dark:text-zinc-500">-- Pilih Profil Kredensial --</span>
            ) : (
              <span className="text-slate-400 dark:text-zinc-500 italic">(Belum ada profil tersimpan)</span>
            )}
          </span>

          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Custom Themed Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 backdrop-blur-xl p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {profiles.length === 0 ? (
            <div className="px-3 py-2 text-center text-xs text-slate-400 dark:text-zinc-500">
              Belum ada profil tersimpan.
            </div>
          ) : (
            <div className="space-y-0.5">
              {profiles.map((p) => {
                const isSelected = matchedProfile?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-left transition ${
                      isSelected
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FolderGit2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white" : "text-blue-500"}`} />
                      <div className="truncate">
                        <span className="font-semibold">{p.name}</span>
                        {p.bucket_name && (
                          <span className={`text-[11px] font-mono ml-1.5 ${isSelected ? "text-blue-100" : "text-slate-500 dark:text-zinc-400"}`}>
                            ({p.bucket_name})
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-white stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
