import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";
import { getSyncStatus, onSyncStatus } from "../services/syncService";

function labelFor(status) {
  if (!status.online) return { text: "Offline — changes queued locally", Icon: CloudOff, className: "text-amber-200" };
  if (status.phase === "syncing") return { text: "Syncing…", Icon: Loader2, className: "text-lime-200 animate-spin" };
  if (status.phase === "queued" || !status.remoteReachable)
    return { text: "Cloud unreachable — retrying", Icon: CloudOff, className: "text-amber-200" };
  if (status.phase === "error") return { text: status.lastError || "Sync error", Icon: AlertCircle, className: "text-red-200" };
  const pending = status.pendingOutbox ?? 0;
  if (pending > 0) return { text: `${pending} change(s) queued`, Icon: Cloud, className: "text-white/90" };
  return { text: "Up to date", Icon: Cloud, className: "text-lime-200" };
}

export default function SyncStatus({ variant = "sidebar" }) {
  const [status, setStatus] = useState(() => getSyncStatus());

  useEffect(() => onSyncStatus(setStatus), []);

  const { text, Icon, className } = labelFor(status);

  if (variant === "default") {
    return (
      <div className="erp-card px-4 py-3 text-sm space-y-1">
        <div className={`flex items-center gap-2 font-medium ${className.replace(/text-\w+-\d+/g, "text-slate-700")}`}>
          <Icon className="h-4 w-4 shrink-0 text-[var(--erp-accent)]" aria-hidden />
          <span className="text-slate-800">{text}</span>
        </div>
        <p className="text-xs text-slate-500"></p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 text-xs space-y-1">
      <div className={`flex items-center gap-2 font-medium ${className}`}>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{text}</span>
      </div>
      <p className="text-[10px] text-white/50 leading-snug">Auto sync · backoff on failure</p>
    </div>
  );
}
