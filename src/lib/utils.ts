import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  const hh = String(hundredths).padStart(2, "0");
  return `${mm}:${ss}.${hh}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function isExpired(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.getTime() < Date.now();
  } catch {
    return false;
  }
}

export function getRemainingTime(dateString: string): string {
  try {
    const target = new Date(dateString).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  } catch {
    return "Unknown";
  }
}

export function extractStreamingKey(location?: string | null, fallbackKey = ""): string {
  if (!location) return fallbackKey;
  const match = location.match(/\/uploads\/([^?#]+?)(?:\/stream)?(?:\?|#|$)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return location || fallbackKey;
}


