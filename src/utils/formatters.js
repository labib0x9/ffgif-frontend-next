export function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function timecode(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function formatExpiry(iso) {
  if (!iso) return "Never expires";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Invalid date";
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "Expired";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `Expires in ${Math.max(1, minutes)}m`;
  if (hours < 24) return `Expires in ${hours}h`;
  if (days < 30) return `Expires in ${days}d`;
  return `Expires ${date.toLocaleDateString()}`;
}

export function formatFullDateTime(iso) {
  if (!iso) return "Never (no expiration)";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function errMsg(e, fallback) {
  if (e && e.error) return e.error;
  return fallback || "something went wrong";
}
