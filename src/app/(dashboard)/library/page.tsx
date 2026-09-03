"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Film,
  Search,
  Plus,
  Sparkles,
  Layers,
  Globe,
  Lock,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GifCard } from "@/components/library/GifCard";
import { GifDetailModal } from "@/components/library/GifDetailModal";
import { ShareModal } from "@/components/library/ShareModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { GifItem } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

type TabType = "all" | "public" | "private" | "recents";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "downloads">("newest");

  // Modals state
  const [selectedGif, setSelectedGif] = useState<GifItem | null>(null);
  const [shareGif, setShareGif] = useState<GifItem | null>(null);
  const [deleteGif, setDeleteGif] = useState<GifItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { refreshQuota } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const fetchGifs = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === "recents") {
        const recents = await api.getRecentGifs();
        setGifs(Array.isArray(recents) ? recents : []);
      } else {
        const res = await api.listGifs(activeTab);
        if (Array.isArray(res)) {
          setGifs(res);
        } else if (res && Array.isArray(res.data)) {
          setGifs(res.data);
        } else {
          setGifs([]);
        }
      }
    } catch (err: any) {
      toastError("Failed to Load GIFs", err?.error || "Could not fetch GIFs from library.");
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toastError]);

  useEffect(() => {
    fetchGifs();
  }, [fetchGifs]);

  const handleToggleVisibility = async (targetGif: GifItem) => {
    const nextStatus = targetGif.status === "public" ? "private" : "public";
    try {
      await api.updateGifVisibility(targetGif.key, { status: nextStatus });
      setGifs((prev) =>
        prev.map((g) => (g.key === targetGif.key ? { ...g, status: nextStatus } : g))
      );
      if (selectedGif && selectedGif.key === targetGif.key) {
        setSelectedGif((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      toastSuccess("Visibility Updated", `GIF marked as ${nextStatus}.`);
    } catch (err: any) {
      toastError("Error", err?.error || "Could not update visibility.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteGif) return;
    setIsDeleting(true);
    try {
      await api.deleteGif(deleteGif.key);
      setGifs((prev) => prev.filter((g) => g.key !== deleteGif.key));
      if (selectedGif?.key === deleteGif.key) {
        setSelectedGif(null);
      }
      setDeleteGif(null);
      refreshQuota();
      toastSuccess("Deleted", "GIF removed from library.");
    } catch (err: any) {
      toastError("Delete Failed", err?.error || "Could not delete GIF.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Sort
  const filteredGifs = useMemo(() => {
    return gifs
      .filter((gif) => {
        const matchesQuery =
          (gif.name && gif.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          gif.key.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "downloads") {
          return (b.download || 0) - (a.download || 0);
        }
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        if (sortBy === "oldest") return timeA - timeB;
        return timeB - timeA;
      });
  }, [gifs, searchQuery, sortBy]);

  const tabs = [
    { id: "all", label: "All GIFs", icon: Layers },
    { id: "public", label: "Public", icon: Globe },
    { id: "private", label: "Private", icon: Lock },
    { id: "recents", label: "Recent Conversions", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-100 border border-white/10 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Actions */}
        <div className="flex items-center gap-2.5">
          <div className="w-full md:w-64">
            <Input
              placeholder="Search by name or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-11 px-3.5 rounded-xl bg-surface-100 border border-white/10 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>

          <Link href="/studio">
            <Button size="md" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Create GIF
            </Button>
          </Link>
        </div>
      </div>

      {/* GIFs Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="aspect-video rounded-2xl bg-surface-100 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredGifs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-100/50 border border-white/10 space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-surface-50 border border-white/10 text-indigo-400 flex items-center justify-center mx-auto shadow-xl">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">No GIFs Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchQuery
                ? `No results matching "${searchQuery}" in this category.`
                : "You haven't converted or stored any GIFs in this section yet."}
            </p>
          </div>
          <Link href="/studio" className="inline-block pt-2">
            <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
              Convert Video to GIF
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGifs.map((gif) => (
            <GifCard
              key={gif.key}
              gif={gif}
              onSelect={(g) => setSelectedGif(g)}
              onShare={(g) => setShareGif(g)}
              onDelete={(g) => setDeleteGif(g)}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <GifDetailModal
        isOpen={!!selectedGif}
        onClose={() => setSelectedGif(null)}
        gif={selectedGif}
        onShare={(g) => {
          setSelectedGif(null);
          setShareGif(g);
        }}
        onDelete={(g) => {
          setSelectedGif(null);
          setDeleteGif(g);
        }}
        onToggleVisibility={handleToggleVisibility}
      />

      <ShareModal
        isOpen={!!shareGif}
        onClose={() => setShareGif(null)}
        gifKey={shareGif?.key || ""}
        gifName={shareGif?.name}
      />

      <ConfirmModal
        isOpen={!!deleteGif}
        onClose={() => setDeleteGif(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete GIF from Library?"
        description={`Are you sure you want to delete "${deleteGif?.name || deleteGif?.key}"? This action is permanent and cannot be undone.`}
        confirmText="Delete GIF"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
