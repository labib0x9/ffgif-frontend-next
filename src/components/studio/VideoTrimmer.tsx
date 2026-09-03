"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Scissors,
  Clock,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface VideoTrimmerProps {
  streamUrl: string;
  filename: string;
  duration: number;
  startTime: number;
  endTime: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
}

export function VideoTrimmer({
  streamUrl,
  duration,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoopingSlice, setIsLoopingSlice] = useState(true);
  const [videoDuration, setVideoDuration] = useState(duration || 10);

  const clipDuration = Math.max(0.1, endTime - startTime);

  // Sync video metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && dur > 0) {
        setVideoDuration(dur);
        if (endTime === 0 || endTime > dur) {
          onEndTimeChange(Math.min(dur, startTime + 5));
        }
      }
    }
  };

  // Keep track of current playback time and handle loop slice
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    if (isLoopingSlice) {
      if (curr >= endTime || curr < startTime) {
        videoRef.current.currentTime = startTime;
        if (!isPlaying) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const seekTo = (time: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(videoDuration, time));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleStartChange = (val: number) => {
    const newStart = Math.max(0, Math.min(val, endTime - 0.2));
    onStartTimeChange(parseFloat(newStart.toFixed(2)));
    seekTo(newStart);
  };

  const handleEndChange = (val: number) => {
    const newEnd = Math.min(videoDuration, Math.max(val, startTime + 0.2));
    onEndTimeChange(parseFloat(newEnd.toFixed(2)));
    seekTo(newEnd);
  };

  return (
    <div className="space-y-4 rounded-3xl bg-surface-100/90 border border-white/10 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* Video Player Display */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-inner group flex items-center justify-center">
        <video
          ref={videoRef}
          src={streamUrl}
          playsInline
          muted={isMuted}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            if (isLoopingSlice && videoRef.current) {
              videoRef.current.currentTime = startTime;
              videoRef.current.play().catch(() => {});
            } else {
              setIsPlaying(false);
            }
          }}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Floating Play Overlay Button */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
            aria-label="Play Video"
          >
            <Play className="w-7 h-7 fill-current ml-1" />
          </button>
        )}

        {/* Current Time Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 font-mono text-xs text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{formatDuration(currentTime)}</span>
          <span className="text-slate-400">/ {formatDuration(videoDuration)}</span>
        </div>

        {/* Top Right Loop Indicator */}
        {isLoopingSlice && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-indigo-600/80 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-md">
            <Repeat className="w-3.5 h-3.5" />
            <span>Looping Trim</span>
          </div>
        )}
      </div>

      {/* Video Scrub / Trim Timeline Controller */}
      <div className="space-y-4 pt-2">
        {/* Timeline Visual Track */}
        <div className="relative h-12 rounded-xl bg-surface-200/90 border border-white/10 p-1 flex items-center select-none overflow-hidden">
          {/* Active Trim Window Highlighting */}
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-cyan-500/30 border-y border-indigo-400/60 rounded-lg pointer-events-none"
            style={{
              left: `${(startTime / videoDuration) * 100}%`,
              width: `${(clipDuration / videoDuration) * 100}%`,
            }}
          />

          {/* Current Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,1)] z-10 pointer-events-none transition-all duration-75"
            style={{
              left: `${(currentTime / videoDuration) * 100}%`,
            }}
          >
            <div className="w-2.5 h-2.5 -ml-1 -top-1 bg-rose-500 rounded-full border border-white shadow" />
          </div>

          {/* Click to Scrub Full Timeline */}
          <input
            type="range"
            min={0}
            max={videoDuration}
            step={0.01}
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />

          {/* Markers / Labels inside Track */}
          <div className="w-full flex justify-between px-3 text-[10px] font-mono text-slate-500 pointer-events-none z-0">
            <span>00:00.00</span>
            <span>{formatDuration(videoDuration / 2)}</span>
            <span>{formatDuration(videoDuration)}</span>
          </div>
        </div>

        {/* Dual Handle Start & End Slider Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-200/70 border border-white/5">
          {/* Start Time Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-indigo-400" />
                Start Time
              </span>
              <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {formatDuration(startTime)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={videoDuration}
              step={0.05}
              value={startTime}
              onChange={(e) => handleStartChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex items-center gap-1 pt-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] px-2"
                onClick={() => handleStartChange(startTime - 0.1)}
              >
                -0.1s
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] px-2"
                onClick={() => handleStartChange(startTime + 0.1)}
              >
                +0.1s
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-[11px] px-2.5 ml-auto"
                onClick={() => handleStartChange(currentTime)}
              >
                Set to Current
              </Button>
            </div>
          </div>

          {/* End Time Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-cyan-400 rotate-180" />
                End Time
              </span>
              <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {formatDuration(endTime)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={videoDuration}
              step={0.05}
              value={endTime}
              onChange={(e) => handleEndChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex items-center gap-1 pt-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] px-2"
                onClick={() => handleEndChange(endTime - 0.1)}
              >
                -0.1s
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] px-2"
                onClick={() => handleEndChange(endTime + 0.1)}
              >
                +0.1s
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-[11px] px-2.5 ml-auto"
                onClick={() => handleEndChange(currentTime)}
              >
                Set to Current
              </Button>
            </div>
          </div>
        </div>

        {/* Player Controls & Clip Duration Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? "secondary" : "primary"}
              onClick={togglePlay}
              leftIcon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              {isPlaying ? "Pause" : "Play Slice"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => seekTo(startTime)}
              title="Jump to Start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="sm"
              variant={isLoopingSlice ? "primary" : "outline"}
              onClick={() => setIsLoopingSlice((prev) => !prev)}
              leftIcon={<Repeat className="w-3.5 h-3.5" />}
              className={isLoopingSlice ? "bg-indigo-600/40 border-indigo-500/50" : ""}
            >
              Loop Trim
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </Button>
          </div>

          {/* Clip Duration Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-50 border border-white/10 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Selected Duration:</span>
            <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded">
              {formatDuration(clipDuration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
