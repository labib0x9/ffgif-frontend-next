"use client";

import React from "react";
import {
  Sliders,
  Layers,
  Maximize2,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ConversionSettingsProps {
  fps: number;
  width: number;
  loop: boolean;
  onFpsChange: (fps: number) => void;
  onWidthChange: (width: number) => void;
  onLoopChange: (loop: boolean) => void;
  onConvert: () => void;
  isConverting?: boolean;
}

export function ConversionSettings({
  fps,
  width,
  loop,
  onFpsChange,
  onWidthChange,
  onLoopChange,
  onConvert,
  isConverting = false,
}: ConversionSettingsProps) {
  const widthPresets = [
    { label: "240p", width: 240 },
    { label: "360p", width: 360 },
    { label: "480p (Default)", width: 480 },
    { label: "720p (HD)", width: 720 },
    { label: "1080p (FHD)", width: 1080 },
  ];

  const getFpsQualityBadge = (val: number) => {
    if (val <= 10) return { label: "Compact / Lightweight", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (val <= 15) return { label: "Balanced Smooth (Recommended)", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
    if (val <= 24) return { label: "Cinematic Motion", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    return { label: "Ultra High FPS", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" };
  };

  const fpsBadge = getFpsQualityBadge(fps);

  return (
    <div className="rounded-3xl bg-surface-100/90 border border-white/10 p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">GIF Optimization & Output</h3>
            <p className="text-[11px] text-slate-400">Configure framerate, dimensions, and looping behavior</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FPS Control */}
        <div className="space-y-3 p-4 rounded-2xl bg-surface-200/70 border border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Framerate (FPS)
            </label>
            <span className="font-mono font-bold text-sm text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
              {fps} FPS
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={fps}
            onChange={(e) => onFpsChange(parseInt(e.target.value, 10))}
            className="w-full"
          />

          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${fpsBadge.color}`}>
              {fpsBadge.label}
            </span>
            <div className="flex gap-1">
              {[10, 15, 24, 30].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onFpsChange(preset)}
                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border transition-all ${
                    fps === preset
                      ? "bg-indigo-600 text-white border-indigo-400"
                      : "bg-surface-50 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Width Resolution Control */}
        <div className="space-y-3 p-4 rounded-2xl bg-surface-200/70 border border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              Width Resolution
            </label>
            <span className="font-mono font-bold text-sm text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
              {width}px
            </span>
          </div>

          <input
            type="range"
            min={100}
            max={1920}
            step={20}
            value={width}
            onChange={(e) => onWidthChange(parseInt(e.target.value, 10))}
            className="w-full"
          />

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {widthPresets.map((preset) => (
              <button
                key={preset.width}
                type="button"
                onClick={() => onWidthChange(preset.width)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                  width === preset.width
                    ? "bg-cyan-600 text-white border-cyan-400 shadow-sm"
                    : "bg-surface-50 text-slate-400 border-white/5 hover:text-white hover:bg-surface-50/80"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Looping Toggle & Conversion Trigger */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-200/90 border border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onLoopChange(!loop)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              loop ? "bg-indigo-600" : "bg-surface-50 border border-white/10"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                loop ? "translate-x-6 shadow-md" : "translate-x-0"
              }`}
            />
          </button>
          <div>
            <span className="text-xs font-bold text-white block">Continuous Infinite Loop</span>
            <span className="text-[11px] text-slate-400">
              {loop ? "GIF repeats endlessly without stopping" : "GIF plays once and stops"}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onConvert}
          isLoading={isConverting}
          leftIcon={<Flame className="w-5 h-5 text-cyan-300" />}
          className="w-full sm:w-auto shadow-xl shadow-indigo-600/30 font-bold px-8"
        >
          Generate High-FPS GIF
        </Button>
      </div>
    </div>
  );
}
