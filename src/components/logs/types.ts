import { LogEvent } from "@/lib/types";

export interface LogConsoleProps {
  logs: LogEvent[];
  onClear: () => void;
}
