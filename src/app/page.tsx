"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeftRight, HardDriveDownload, ShieldCheck, Sparkles, Moon, Sun, Settings, Database, X } from "lucide-react";
import dynamic from "next/dynamic";

const BucketCard = dynamic(
  () => import("@/components/bucket").then((mod) => mod.BucketCard),
  { ssr: false }
);

const ConflictSettings = dynamic(
  () => import("@/components/conflict").then((mod) => mod.ConflictSettings),
  { ssr: false }
);

const ProgressBar = dynamic(
  () => import("@/components/progress").then((mod) => mod.ProgressBar),
  { ssr: false }
);

const LogConsole = dynamic(
  () => import("@/components/logs").then((mod) => mod.LogConsole),
  { ssr: false }
);

const ProfileManagerModal = dynamic(
  () => import("@/components/profiles").then((mod) => mod.ProfileManagerModal),
  { ssr: false }
);
import { BucketConfig, ConflictStrategy, LogEvent, ProgressEvent, ProfileRecord } from "@/lib/types";
import {
  startMigration,
  cancelMigration,
  onMigrationProgress,
  onMigrationLog,
  getProfiles,
} from "@/lib/tauri";

const INITIAL_SOURCE: BucketConfig = {
  endpoint_url: "https://s3.ap-southeast-1.wasabisys.com",
  region: "ap-southeast-1",
  access_key_id: "",
  secret_access_key: "",
  bucket_name: "",
  prefix: "",
  use_path_style: true,
};

const INITIAL_TARGET: BucketConfig = {
  endpoint_url: "https://s3.ap-southeast-1.wasabisys.com",
  region: "ap-southeast-1",
  access_key_id: "",
  secret_access_key: "",
  bucket_name: "",
  prefix: "",
  use_path_style: true,
};

const INITIAL_PROGRESS: ProgressEvent = {
  transfer_mode: "server_side_copy",
  copied_files: 0,
  skipped_files: 0,
  failed_files: 0,
  total_files: 0,
  copied_bytes: 0,
  total_bytes: 0,
  current_file: "",
  status: "idle",
};

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sourceConfig, setSourceConfig] = useState<BucketConfig>(INITIAL_SOURCE);
  const [targetConfig, setTargetConfig] = useState<BucketConfig>(INITIAL_TARGET);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>("ReplaceIfDifferent");
  const [concurrency, setConcurrency] = useState<number>(16);
  const [progress, setProgress] = useState<ProgressEvent>(INITIAL_PROGRESS);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapCount, setSwapCount] = useState(0);

  // Load profiles from SQLite database on mount
  useEffect(() => {
    const loadStoredProfiles = async () => {
      try {
        const list = await getProfiles();
        setProfiles(list);
      } catch (err) {
        console.error("Gagal membaca profil dari SQLite:", err);
      }
    };
    loadStoredProfiles();
  }, []);

  // Sync theme with HTML class & localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = savedTheme || "dark";
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  };

  // Auto-detect if host/endpoint is identical
  const cleanSourceEp = sourceConfig.endpoint_url.trim().replace(/\/+$/, "").toLowerCase();
  const cleanTargetEp = targetConfig.endpoint_url.trim().replace(/\/+$/, "").toLowerCase();
  const isSameHost = Boolean(cleanSourceEp && cleanTargetEp && cleanSourceEp === cleanTargetEp);

  // Subscribe to Tauri IPC events
  useEffect(() => {
    let unlistenProgress: (() => void) | undefined;
    let unlistenLog: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenProgress = await onMigrationProgress((evt) => {
        setProgress(evt);
        if (evt.status === "completed" || evt.status === "cancelled" || evt.status === "error") {
          setIsMigrating(false);
        } else {
          setIsMigrating(true);
        }
      });

      unlistenLog = await onMigrationLog((log) => {
        setLogs((prev) => [...prev.slice(-499), log]);
      });
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenLog) unlistenLog();
    };
  }, []);

  // Swap / Switch Position between Source and Target with distinct animation
  const handleSwap = () => {
    if (isSwapping) return;
    setIsSwapping(true);
    setSwapCount((c) => c + 1);

    // Swap data halfway through the animation for realistic transition
    setTimeout(() => {
      setSourceConfig(targetConfig);
      setTargetConfig(sourceConfig);
    }, 150);

    setTimeout(() => {
      setIsSwapping(false);
    }, 480);

    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: "⇄ Posisi Source dan Target bucket berhasil ditukar (Swapped).",
      },
    ]);
  };

  const handleStartMigration = async () => {
    if (!sourceConfig.bucket_name.trim() || !targetConfig.bucket_name.trim()) {
      alert("Harap isi nama Source Bucket dan Target Bucket terlebih dahulu!");
      return;
    }
    if (!sourceConfig.access_key_id.trim() || !targetConfig.access_key_id.trim()) {
      alert("Harap lengkapi Access Key ID untuk kedua bucket!");
      return;
    }

    setIsMigrating(true);
    setProgress({
      ...INITIAL_PROGRESS,
      status: "scanning",
      transfer_mode: isSameHost ? "server_side_copy" : "client_streaming",
    });

    try {
      await startMigration(sourceConfig, targetConfig, conflictStrategy, concurrency);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          level: "error",
          message: `Gagal memulai migrasi: ${msg}`,
        },
      ]);
      setIsMigrating(false);
      setProgress((p) => ({ ...p, status: "error" }));
    }
  };

  const handleCancelMigration = async () => {
    try {
      await cancelMigration();
      setIsMigrating(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={`h-screen overflow-hidden ${
        theme === "dark"
          ? "dark bg-[#090a0f] text-zinc-100"
          : "bg-slate-100 text-slate-900"
      } font-sans p-3 sm:p-4 flex flex-col justify-between transition-colors duration-200`}
    >
      {/* Glow background effects in dark mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 dark:block hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[128px]" />
        <div className="absolute top-1/2 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[128px]" />
      </div>

      <div className="w-full flex-1 flex flex-col gap-3 min-h-0">
        {/* App Header (Compact) */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent shadow-md shadow-blue-500/10">
              <HardDriveDownload className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  Wasabi & S3 Bucket Migration Tool
                </h1>
                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.2 text-[9px] font-semibold text-blue-600 dark:text-blue-300">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                Auto-Detect Server-Side Copy (0% bandwidth) & Cross-Host Streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-[11px] text-slate-700 dark:text-zinc-300 shadow-sm dark:shadow-none">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>TLS Encrypted</span>
            </div>

            {/* Manage Credential Profiles Button */}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              title="Kelola Profil Kredensial SQLite"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold shadow-sm transition ${
                isProfileModalOpen
                  ? "border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-200 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/80"
              }`}
            >
              <Database className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span>Profil Kredensial</span>
              {profiles.length > 0 && (
                <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 font-mono font-bold">
                  {profiles.length}
                </span>
              )}
            </button>

            {/* Settings Drawer Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title="Buka Pengaturan Migrasi"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold shadow-sm transition ${
                isSettingsOpen
                  ? "border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-200 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/80"
              }`}
            >
              <Settings className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span>Settings</span>
            </button>

            {/* Dark / Light Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-xs font-medium text-slate-700 dark:text-zinc-200 shadow-sm dark:shadow-none hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Two-Side Grid (Source vs Destination) with Center Swap Button */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch shrink-0">
          {/* Left: Source */}
          <BucketCard
            key={`source-${swapCount}`}
            title="Source Bucket"
            side="source"
            config={sourceConfig}
            onChange={setSourceConfig}
            profiles={profiles}
            onOpenProfileManager={() => setIsProfileModalOpen(true)}
            disabled={isMigrating || isSwapping}
            className={isSwapping ? "animate-swap-left ring-2 ring-blue-500/50" : "transition-all duration-300"}
          />

          {/* Floating Swap Button in Middle (Between Columns) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <button
              type="button"
              disabled={isMigrating || isSwapping}
              onClick={handleSwap}
              title="Tukar Posisi Source dan Target (Swap)"
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 shadow-2xl backdrop-blur-xl hover:border-blue-500 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group ${
                isSwapping ? "scale-125 border-blue-500 text-blue-500 ring-4 ring-blue-500/20" : ""
              }`}
            >
              <ArrowLeftRight
                className={`h-4 w-4 transition-transform duration-500 text-blue-500 dark:text-blue-400 ${
                  isSwapping ? "rotate-180 scale-110" : "group-hover:rotate-180"
                }`}
              />
            </button>
          </div>

          {/* Right: Target */}
          <BucketCard
            key={`target-${swapCount}`}
            title="Destination Bucket"
            side="target"
            config={targetConfig}
            onChange={setTargetConfig}
            profiles={profiles}
            onOpenProfileManager={() => setIsProfileModalOpen(true)}
            disabled={isMigrating || isSwapping}
            className={isSwapping ? "animate-swap-right ring-2 ring-emerald-500/50" : "transition-all duration-300"}
          />
        </div>

        {/* Progress Bar & Actions */}
        <div className="shrink-0">
          <ProgressBar
            progress={progress}
            isSameHost={isSameHost}
            onStart={handleStartMigration}
            onCancel={handleCancelMigration}
            isMigrating={isMigrating}
          />
        </div>

        {/* Real-time Activity Logs (Expanded to fill remaining height) */}
        <div className="flex-1 min-h-0 flex flex-col">
          <LogConsole logs={logs} onClear={() => setLogs([])} />
        </div>

        {/* Footer */}
        <footer className="shrink-0 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 pt-1 border-t border-slate-200/80 dark:border-zinc-800/80">
          <span>Wasabi & S3 Bucket Integration Client</span>
          <span className="font-medium text-slate-600 dark:text-zinc-400">
            by <strong className="text-slate-800 dark:text-zinc-200 font-semibold">DKA System Tools</strong>
          </span>
        </footer>
      </div>

      {/* Right-Side Settings Drawer (50% width overlay) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSettingsOpen(false)}
          />

          {/* Drawer Panel (50% width on md/lg) */}
          <div className="relative w-full md:w-1/2 lg:w-1/2 h-full bg-white dark:bg-[#0c0d14] border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col p-6 z-10 overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Pengaturan Migrasi & Transfer
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Konfigurasi penanganan konflik dan opsi lanjutan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conflict Strategy Settings inside Drawer */}
            <div className="space-y-6">
              <ConflictSettings
                strategy={conflictStrategy}
                onChange={(s) => setConflictStrategy(s)}
                concurrency={concurrency}
                onConcurrencyChange={(c) => setConcurrency(c)}
                disabled={isMigrating}
              />

              {/* Informational Notes */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  💡 Tips Pemindahan Bucket:
                </h4>
                <ul className="text-xs text-slate-600 dark:text-zinc-400 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong className="text-slate-800 dark:text-zinc-300">Host Sama:</strong> Jika endpoint Source dan Target sama, sistem secara otomatis mengaktifkan mode <em>Server-Side Copy</em> tanpa menggunakan bandwidth laptop.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-zinc-300">Replace jika Checksum Beda:</strong> Sangat ideal jika Anda sebelumnya sudah memindahkan sebagian file dan ingin melanjutkan (resume) tanpa menduplikasi data.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-zinc-300">Tukar Posisi (Swap):</strong> Gunakan tombol ⇄ di dashboard tengah untuk membalikkan arah migrasi secara cepat.
                  </li>
                </ul>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Management Modal (SQLite) */}
      <ProfileManagerModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfilesUpdated={(updated) => setProfiles(updated)}
        onSelectForSource={(p) => {
          setSourceConfig((prev) => ({
            ...prev,
            endpoint_url: p.endpoint_url,
            region: p.region,
            access_key_id: p.access_key_id,
            secret_access_key: p.secret_access_key,
            bucket_name: p.bucket_name,
            prefix: p.prefix,
            use_path_style: p.use_path_style,
          }));
        }}
        onSelectForTarget={(p) => {
          setTargetConfig((prev) => ({
            ...prev,
            endpoint_url: p.endpoint_url,
            region: p.region,
            access_key_id: p.access_key_id,
            secret_access_key: p.secret_access_key,
            bucket_name: p.bucket_name,
            prefix: p.prefix,
            use_path_style: p.use_path_style,
          }));
        }}
      />
    </div>
  );
}

