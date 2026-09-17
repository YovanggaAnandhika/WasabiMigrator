import { ConflictStrategy } from "@/lib/types";
import { RefreshCw, FastForward, ShieldAlert } from "lucide-react";

export interface ConflictSettingsProps {
  strategy: ConflictStrategy;
  onChange: (s: ConflictStrategy) => void;
  concurrency: number;
  onConcurrencyChange: (c: number) => void;
  disabled?: boolean;
}

export const STRATEGIES: {
  id: ConflictStrategy;
  label: string;
  badge: string;
  description: string;
  icon: typeof RefreshCw;
}[] = [
  {
    id: "ReplaceIfDifferent",
    label: "Replace jika Checksum Berbeda",
    badge: "Recommended",
    description: "Hanya copy ulang jika ETag/hash atau ukuran file di target berbeda. Sangat hemat waktu dan bandwidth.",
    icon: RefreshCw,
  },
  {
    id: "IgnoreExisting",
    label: "Ignore / Skip jika File Ada",
    badge: "Safe Resume",
    description: "Jika file sudah ada di target bucket dengan nama yang sama, file akan otomatis dilewati.",
    icon: FastForward,
  },
  {
    id: "AlwaysOverwrite",
    label: "Selalu Timpa Semua File",
    badge: "Full Overwrite",
    description: "Meng-upload ulang dan menimpa semua file target tanpa pengecekan awal.",
    icon: ShieldAlert,
  },
];
